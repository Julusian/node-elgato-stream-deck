import { HIDDevice } from '../device'
import { imageToByteArray } from '../util'
import {
	EncodeJPEGHelper,
	InternalFillImageOptions,
	OpenStreamDeckOptions,
	StreamDeckBase,
	StreamDeckProperties,
} from './base'

/**
 * Base class for generation 2 hardware (starting with the xl)
 */
export abstract class StreamDeckGen2Base extends StreamDeckBase {
	private encodeJPEG: EncodeJPEGHelper
	private xyFlip: boolean

	constructor(
		device: HIDDevice,
		options: Required<OpenStreamDeckOptions>,
		properties: StreamDeckProperties,
		disableXYFlip?: boolean
	) {
		super(device, options, properties)

		this.encodeJPEG = options.encodeJPEG
		this.xyFlip = !disableXYFlip
	}

	/**
	 * Sets the brightness of the keys on the Stream Deck
	 *
	 * @param {number} percentage The percentage brightness
	 */
	public async setBrightness(percentage: number): Promise<void> {
		if (percentage < 0 || percentage > 100) {
			throw new RangeError('Expected brightness percentage to be between 0 and 100')
		}

		// prettier-ignore
		const brightnessCommandBuffer = Buffer.from([
			0x03,
			0x08, percentage, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		])
		await this.device.sendFeatureReport(brightnessCommandBuffer)
	}

	public async resetToLogo(): Promise<void> {
		// prettier-ignore
		const resetCommandBuffer = Buffer.from([
			0x03,
			0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		])
		await this.device.sendFeatureReport(resetCommandBuffer)
	}

	public async getFirmwareVersion(): Promise<string> {
		const val = await this.device.getFeatureReport(5, 32)
		const end = val.indexOf(0)
		return val.toString('ascii', 6, end === -1 ? undefined : end)
	}

	public async getSerialNumber(): Promise<string> {
		const val = await this.device.getFeatureReport(6, 32)
		return val.toString('ascii', 2, 14)
	}

	protected getFillImageCommandHeaderLength(): number {
		return 8
	}

	protected writeFillImageCommandHeader(
		buffer: Buffer,
		keyIndex: number,
		partIndex: number,
		isLast: boolean,
		bodyLength: number
	): void {
		buffer.writeUInt8(0x02, 0)
		buffer.writeUInt8(0x07, 1)
		buffer.writeUInt8(keyIndex, 2)
		buffer.writeUInt8(isLast ? 1 : 0, 3)
		buffer.writeUInt16LE(bodyLength, 4)
		buffer.writeUInt16LE(partIndex++, 6)
	}

	protected getFillImagePacketLength(): number {
		return 1024
	}

	protected async convertFillImage(sourceBuffer: Buffer, sourceOptions: InternalFillImageOptions): Promise<Buffer> {
		const byteBuffer = imageToByteArray(
			sourceBuffer,
			sourceOptions,
			{ colorMode: 'rgba', xFlip: this.xyFlip, yFlip: this.xyFlip },
			0,
			this.ICON_SIZE
		)

		return this.encodeJPEG(byteBuffer, this.ICON_SIZE, this.ICON_SIZE)
	}
}
