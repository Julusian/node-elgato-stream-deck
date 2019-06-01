import { encodeJPEG } from '../jpeg'
import { bufferToIntArray, imageToByteArray } from '../util'
import { StreamDeckBase, StreamDeckProperties } from './base'
import { DeviceModelId, KeyIndex, StreamDeckDeviceInfo } from './id'

const xlProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.XL,
	COLUMNS: 8,
	ROWS: 4,
	ICON_SIZE: 96,
	KEY_DIRECTION: 'ltr'
}

export class StreamDeckXL extends StreamDeckBase {
	constructor(deviceInfo: StreamDeckDeviceInfo) {
		super(deviceInfo, xlProperties, 4)
	}
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
		const brightnessCommandBuffer = [
			0x03, 0x08, percentage, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		]
		this.device.sendFeatureReport(brightnessCommandBuffer)
	}

	protected transformKeyIndex(keyIndex: KeyIndex): KeyIndex {
		return keyIndex
	}

	protected generateFillImageWrites(
		keyIndex: KeyIndex,
		sourceBuffer: Buffer,
		sourceOffset: number,
		sourceStride: number
	): number[][] {
		const MAX_PACKET_SIZE = 1024

		const byteBuffer = imageToByteArray(
			sourceBuffer,
			sourceOffset,
			sourceStride,
			this.rotateCoordinates.bind(this),
			'rgba',
			this.ICON_SIZE,
			0
		)

		const jpegBuffer = encodeJPEG(byteBuffer, this.ICON_SIZE, this.ICON_SIZE)

		const result: number[][] = []

		let byteOffset = 0
		const firstPart = 0
		for (let part = firstPart; byteOffset < jpegBuffer.length; part++) {
			const remainingBytes = jpegBuffer.length - byteOffset
			const packet = Buffer.alloc(MAX_PACKET_SIZE)

			const byteCount = Math.min(remainingBytes, MAX_PACKET_SIZE - 8)
			this.writeFillImageCommandHeader(packet, keyIndex, part, false, byteCount) // isLast gets set later if needed

			jpegBuffer.copy(packet, 8, byteOffset, byteOffset + byteCount)
			byteOffset += byteCount

			if (byteOffset >= jpegBuffer.length) {
				// Reached the end of the payload
				this.writeFillImageCommandHeader(packet, keyIndex, part, true, byteCount)
			}

			result.push(bufferToIntArray(packet))
		}

		return result
	}

	private writeFillImageCommandHeader(
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

	private rotateCoordinates(x: number, y: number): { x: number; y: number } {
		return { x: this.ICON_SIZE - x - 1, y: this.ICON_SIZE - y - 1 }
	}
}
