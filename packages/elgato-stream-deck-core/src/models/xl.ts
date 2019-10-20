import { HIDDevice } from '../device'
import { imageToByteArray, numberArrayToString } from '../util'
import { EncodeJPEGHelper, OpenStreamDeckOptions, StreamDeckBase, StreamDeckProperties } from './base'
import { DeviceModelId, KeyIndex } from './id'

const xlProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.XL,
	COLUMNS: 8,
	ROWS: 4,
	ICON_SIZE: 96,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 4
}

export class StreamDeckXL extends StreamDeckBase {
	private encodeJPEG: EncodeJPEGHelper

	constructor(device: HIDDevice, options: OpenStreamDeckOptions) {
		super(device, options, xlProperties)

		this.encodeJPEG = options.encodeJPEG!
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
		const brightnessCommandBuffer = [
			0x03,
			0x08, percentage, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		]
		await this.device.sendFeatureReport(brightnessCommandBuffer)
	}

	public async resetToLogo(): Promise<void> {
		// prettier-ignore
		const resetCommandBuffer = [
			0x03,
			0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		]
		await this.device.sendFeatureReport(resetCommandBuffer)
	}

	public getFirmwareVersion(): Promise<string> {
		return this.device.getFeatureReport(5, 32).then(val => numberArrayToString(val.slice(6)))
	}

	public getSerialNumber(): Promise<string> {
		return this.device.getFeatureReport(6, 32).then(val => numberArrayToString(val.slice(2)))
	}

	protected transformKeyIndex(keyIndex: KeyIndex): KeyIndex {
		return keyIndex
	}

	protected getFillImageCommandHeaderLength() {
		return 8
	}

	protected writeFillImageCommandHeader(
		buffer: Buffer,
		keyIndex: number,
		partIndex: number,
		isLast: boolean,
		bodyLength: number
	) {
		buffer.writeUInt8(0x02, 0)
		buffer.writeUInt8(0x07, 1)
		buffer.writeUInt8(keyIndex, 2)
		buffer.writeUInt8(isLast ? 1 : 0, 3)
		buffer.writeUInt16LE(bodyLength, 4)
		buffer.writeUInt16LE(partIndex++, 6)
	}

	protected getFillImagePacketLength() {
		return 1024
	}

	protected convertFillImage(sourceBuffer: Buffer, sourceOffset: number, sourceStride: number): Promise<Buffer> {
		const byteBuffer = imageToByteArray(
			sourceBuffer,
			sourceOffset,
			sourceStride,
			0,
			this.transformCoordinates.bind(this),
			'rgba',
			this.ICON_SIZE
		)

		return this.encodeJPEG(byteBuffer, this.ICON_SIZE, this.ICON_SIZE)
	}

	private transformCoordinates(x: number, y: number): { x: number; y: number } {
		return { x: this.ICON_SIZE - x - 1, y: this.ICON_SIZE - y - 1 }
	}
}
