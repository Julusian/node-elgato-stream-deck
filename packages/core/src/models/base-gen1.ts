import { HIDDevice } from '../device'
import { OpenStreamDeckOptions, StreamDeckBase, StreamDeckProperties } from './base'

/**
 * Base class for generation 1 hardware (before the xl)
 */
export abstract class StreamDeckGen1Base extends StreamDeckBase {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>, properties: StreamDeckProperties) {
		super(device, options, properties)
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
			0x05,
			0x55, 0xaa, 0xd1, 0x01, percentage, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		])
		await this.device.sendFeatureReport(brightnessCommandBuffer)
	}

	public async resetToLogo(): Promise<void> {
		// prettier-ignore
		const resetCommandBuffer = Buffer.from([
			0x0b,
			0x63, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		])
		await this.device.sendFeatureReport(resetCommandBuffer)
	}

	public async getFirmwareVersion(): Promise<string> {
		const val = await this.device.getFeatureReport(4, 17)
		const end = val.indexOf(0)
		return val.toString('ascii', 5, end === -1 ? undefined : end)
	}

	public async getSerialNumber(): Promise<string> {
		const val = await this.device.getFeatureReport(3, 17)
		return val.toString('ascii', 5, 17)
	}

	// protected getFillImageCommandHeaderLength(): number {
	// 	return 8
	// }

	// protected writeFillImageCommandHeader(
	// 	buffer: Buffer,
	// 	keyIndex: number,
	// 	partIndex: number,
	// 	isLast: boolean,
	// 	bodyLength: number
	// ): void {
	// 	buffer.writeUInt8(0x02, 0)
	// 	buffer.writeUInt8(0x07, 1)
	// 	buffer.writeUInt8(keyIndex, 2)
	// 	buffer.writeUInt8(isLast ? 1 : 0, 3)
	// 	buffer.writeUInt16LE(bodyLength, 4)
	// 	buffer.writeUInt16LE(partIndex++, 6)
	// }

	// protected getFillImagePacketLength(): number {
	// 	return 1024
	// }

	// protected async convertFillImage(sourceBuffer: Buffer, sourceOptions: InternalFillImageOptions): Promise<Buffer> {
	// 	const byteBuffer = imageToByteArray(
	// 		sourceBuffer,
	// 		sourceOptions,
	// 		0,
	// 		this.transformCoordinates.bind(this),
	// 		'rgba',
	// 		this.ICON_SIZE
	// 	)

	// 	return this.encodeJPEG(byteBuffer, this.ICON_SIZE, this.ICON_SIZE)
	// }

	// private transformCoordinates(x: number, y: number): { x: number; y: number } {
	// 	return { x: this.ICON_SIZE - x - 1, y: this.ICON_SIZE - y - 1 }
	// }
}
