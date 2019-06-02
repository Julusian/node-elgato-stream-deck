import { bufferToIntArray, buildBMPHeader, buildFillImageCommandHeader, imageToByteArray } from '../util'
import { StreamDeckBase, StreamDeckProperties } from './base'
import { DeviceModelId, KeyIndex, StreamDeckDeviceInfo } from './id'

const miniProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.MINI,
	COLUMNS: 3,
	ROWS: 2,
	ICON_SIZE: 80,
	KEY_DIRECTION: 'ltr'
}

export class StreamDeckMini extends StreamDeckBase {
	constructor(deviceInfo: StreamDeckDeviceInfo) {
		super(deviceInfo, miniProperties, 1)
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
			'bgr',
			this.ICON_SIZE
		)

		// The mini use smaller packets and chunk to fill as few as possible

		const result: number[][] = []

		let byteOffset = 0
		const firstPart = 0
		for (let part = firstPart; byteOffset < this.ICON_BYTES; part++) {
			const packet = Buffer.alloc(MAX_PACKET_SIZE)
			const header = buildFillImageCommandHeader(keyIndex, part, false) // isLast gets set later if needed
			packet.set(header, 0)
			let nextPosition = header.length
			if (part === firstPart) {
				const bmpHeader = buildBMPHeader(this.ICON_SIZE, this.ICON_BYTES, 2835)
				packet.set(bmpHeader, nextPosition)
				nextPosition += bmpHeader.length
			}

			const byteCount = MAX_PACKET_SIZE - nextPosition
			byteBuffer.copy(packet, nextPosition, byteOffset, byteOffset + byteCount)
			byteOffset += byteCount

			if (byteOffset >= this.ICON_BYTES) {
				// Reached the end of the payload
				packet.set(buildFillImageCommandHeader(keyIndex, part, true), 0)
			}

			result.push(bufferToIntArray(packet))
		}

		return result
	}

	private rotateCoordinates(x: number, y: number): { x: number; y: number } {
		return { x: y, y: x }
	}
}
