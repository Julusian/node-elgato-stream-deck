import { encodeJPEG } from '../jpeg'
import { imageToByteArray, numberArrayToString } from '../util'
import { StreamDeckBase } from './base'
import { KeyIndex } from './id'

/**
 * Base class for generation 2 hardware (starting with the xl)
 */
export abstract class StreamDeckGen2Base extends StreamDeckBase {
	/**
	 * Sets the brightness of the keys on the Stream Deck
	 *
	 * @param {number} percentage The percentage brightness
	 */
	public setBrightness(percentage: number) {
		if (percentage < 0 || percentage > 100) {
			throw new RangeError('Expected brightness percentage to be between 0 and 100')
		}

		// prettier-ignore
		const brightnessCommandBuffer = Buffer.from([
			0x03, 0x08, percentage, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		])
		this.device.sendFeatureReport(brightnessCommandBuffer)
	}

	public resetToLogo() {
		// prettier-ignore
		const resetCommandBuffer = Buffer.from([
			0x03,
			0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		])
		this.device.sendFeatureReport(resetCommandBuffer)
	}

	public getFirmwareVersion() {
		return numberArrayToString(this.device.getFeatureReport(5, 32).slice(6))
	}

	public getSerialNumber() {
		return numberArrayToString(this.device.getFeatureReport(6, 32).slice(2))
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

	protected convertFillImage(sourceBuffer: Buffer, sourceOffset: number, sourceStride: number): Buffer {
		const byteBuffer = imageToByteArray(
			sourceBuffer,
			sourceOffset,
			sourceStride,
			0,
			this.transformCoordinates.bind(this),
			'rgba',
			this.ICON_SIZE
		)

		return encodeJPEG(byteBuffer, this.ICON_SIZE, this.ICON_SIZE)
	}

	private transformCoordinates(x: number, y: number): { x: number; y: number } {
		return { x: this.ICON_SIZE - x - 1, y: this.ICON_SIZE - y - 1 }
	}
}
