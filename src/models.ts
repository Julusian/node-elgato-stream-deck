import { KeyIndex } from '.'
import { bufferToIntArray, buildBMPHeader, buildFillImageCommandHeader, imageToByteArray } from './util'

export enum DeviceModelId {
	ORIGINAL = 'original',
	MINI = 'mini'
}

export abstract class DeviceModel {
	public readonly MODEL_ID: DeviceModelId
	public readonly PRODUCT_ID: number
	public readonly MAX_PACKET_SIZE: number

	public readonly KEY_COLS: number
	public readonly KEY_ROWS: number

	get NUM_KEYS() {
		return this.KEY_COLS * this.KEY_ROWS
	}

	public readonly IMAGE_SIZE: number
	public readonly IMAGE_BORDER: number
	public readonly IMAGE_PPM: number

	get IMAGE_BYTES() {
		return this.IMAGE_SIZE * this.IMAGE_SIZE * 3
	}

	get PADDED_ICON_SIZE() {
		return this.IMAGE_SIZE + this.IMAGE_BORDER * 2
	}
	get PADDED_ICON_BYTES() {
		return this.PADDED_ICON_SIZE * this.PADDED_ICON_SIZE * 3
	}

	public abstract generateFillImageWrites(
		keyIndex: KeyIndex,
		sourceBuffer: Buffer,
		sourceOffset: number,
		sourceStride: number
	): number[][]
}

export const DEVICE_MODELS: DeviceModel[] = [
	new (class extends DeviceModel {
		// Original
		public readonly MODEL_ID = DeviceModelId.ORIGINAL
		public readonly PRODUCT_ID = 0x0060
		public readonly MAX_PACKET_SIZE = 8191
		public readonly KEY_COLS = 5
		public readonly KEY_ROWS = 3
		public readonly IMAGE_SIZE = 72
		public readonly IMAGE_BORDER = 0
		public readonly IMAGE_PPM = 3780

		public generateFillImageWrites(
			keyIndex: KeyIndex,
			sourceBuffer: Buffer,
			sourceOffset: number,
			sourceStride: number
		): number[][] {
			const byteBuffer = imageToByteArray(
				this,
				sourceBuffer,
				sourceOffset,
				sourceStride,
				this.flipCoordinates.bind(this)
			)

			// The original uses larger packets, and splits the payload equally across 2

			const bmpHeader = buildBMPHeader(this)
			const bytesCount = this.PADDED_ICON_BYTES + bmpHeader.length
			const frame1Bytes = bytesCount / 2 - bmpHeader.length

			const packet1 = Buffer.alloc(this.MAX_PACKET_SIZE)
			const packet1Header = buildFillImageCommandHeader(keyIndex, 0x01, false)
			packet1.set(packet1Header, 0)
			packet1.set(bmpHeader, packet1Header.length)
			byteBuffer.copy(packet1, packet1Header.length + bmpHeader.length, 0, frame1Bytes)

			const packet2 = Buffer.alloc(this.MAX_PACKET_SIZE)
			const packet2Header = buildFillImageCommandHeader(keyIndex, 0x02, true)
			packet2.set(packet2Header, 0)
			byteBuffer.copy(packet2, packet2Header.length, frame1Bytes)

			return [bufferToIntArray(packet1), bufferToIntArray(packet2)]
		}

		private flipCoordinates(x: number, y: number): { x: number; y: number } {
			return { x: this.IMAGE_SIZE - x - 1, y }
		}
	})(),
	new (class extends DeviceModel {
		// Mini
		public readonly MODEL_ID = DeviceModelId.MINI
		public readonly PRODUCT_ID = 0x0063
		public readonly MAX_PACKET_SIZE = 1024
		public readonly KEY_COLS = 3
		public readonly KEY_ROWS = 2
		public readonly IMAGE_SIZE = 72
		public readonly IMAGE_BORDER = 4
		public readonly IMAGE_PPM = 2835

		public generateFillImageWrites(
			keyIndex: KeyIndex,
			sourceBuffer: Buffer,
			sourceOffset: number,
			sourceStride: number
		): number[][] {
			const byteBuffer = imageToByteArray(
				this,
				sourceBuffer,
				sourceOffset,
				sourceStride,
				this.rotateCoordinates.bind(this)
			)

			// The mini use smaller packets and chunk to fill as few as possible

			const result: number[][] = []

			let byteOffset = 0
			const firstPart = 1
			for (let part = firstPart; byteOffset < this.PADDED_ICON_BYTES; part++) {
				const packet = Buffer.alloc(this.MAX_PACKET_SIZE)
				const header = buildFillImageCommandHeader(keyIndex, part, false) // isLast gets set later if needed
				packet.set(header, 0)
				let nextPosition = header.length
				if (part === firstPart) {
					const bmpHeader = buildBMPHeader(this)
					packet.set(bmpHeader, nextPosition)
					nextPosition += bmpHeader.length
				}

				const byteCount = this.MAX_PACKET_SIZE - nextPosition
				byteBuffer.copy(packet, nextPosition, byteOffset, byteOffset + byteCount)
				byteOffset += byteCount

				if (byteOffset >= this.PADDED_ICON_BYTES) {
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
	})()
]
