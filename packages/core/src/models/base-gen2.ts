import { HIDDevice } from '../device'
import { transformImageBuffer } from '../util'
import {
	EncodeJPEGHelper,
	InternalFillImageOptions,
	OpenStreamDeckOptions,
	StreamDeckBase,
	StreamDeckProperties,
} from './base'
import { StreamdeckDefaultImageWriter } from '../imageWriter/imageWriter'
import { StreamdeckGen2ImageHeaderGenerator } from '../imageWriter/headerGenerator'

/**
 * Base class for generation 2 hardware (starting with the xl)
 */
export abstract class StreamDeckGen2Base extends StreamDeckBase {
	protected readonly encodeJPEG: EncodeJPEGHelper
	protected readonly xyFlip: boolean

	constructor(
		device: HIDDevice,
		options: Required<OpenStreamDeckOptions>,
		properties: StreamDeckProperties,
		disableXYFlip?: boolean
	) {
		super(device, options, properties, new StreamdeckDefaultImageWriter(new StreamdeckGen2ImageHeaderGenerator()))

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
		const end = val[1] + 2
		return new TextDecoder('ascii').decode(val.subarray(6, end))
	}

	public async getSerialNumber(): Promise<string> {
		const val = await this.device.getFeatureReport(6, 32)
		const end = val[1] + 2
		return new TextDecoder('ascii').decode(val.subarray(2, end))
	}

	protected async convertFillImage(
		sourceBuffer: Uint8Array,
		sourceOptions: InternalFillImageOptions
	): Promise<Uint8Array> {
		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions,
			{ colorMode: 'rgba', xFlip: this.xyFlip, yFlip: this.xyFlip },
			0,
			this.ICON_SIZE
		)

		return this.encodeJPEG(byteBuffer, this.ICON_SIZE, this.ICON_SIZE)
	}
}
