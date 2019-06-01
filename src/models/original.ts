import { bufferToIntArray, buildBMPHeader, buildFillImageCommandHeader, imageToByteArray } from '../util'
import { OpenStreamDeckOptions, StreamDeckBase, StreamDeckProperties } from './base'
import { DeviceModelId, KeyIndex, StreamDeckDeviceInfo } from './id'

const miniProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.ORIGINAL,
	COLUMNS: 5,
	ROWS: 3,
	ICON_SIZE: 72,
	KEY_DIRECTION: 'rtl'
}

export class StreamDeckOriginal extends StreamDeckBase {
	private readonly useOriginalKeyOrder: boolean

	constructor(deviceInfo: StreamDeckDeviceInfo, options: OpenStreamDeckOptions) {
		super(deviceInfo, miniProperties, 1)

		this.useOriginalKeyOrder = !!options.useOriginalKeyOrder
	}

	protected transformKeyIndex(keyIndex: KeyIndex): KeyIndex {
		if (!this.useOriginalKeyOrder) {
			// Horizontal flip
			const half = (this.KEY_COLUMNS - 1) / 2
			const diff = ((keyIndex % this.KEY_COLUMNS) - half) * -half
			return keyIndex + diff
		} else {
			return keyIndex
		}
	}

	protected generateFillImageWrites(
		keyIndex: KeyIndex,
		sourceBuffer: Buffer,
		sourceOffset: number,
		sourceStride: number
	): number[][] {
		const MAX_PACKET_SIZE = 8191

		const byteBuffer = imageToByteArray(
			sourceBuffer,
			sourceOffset,
			sourceStride,
			this.flipCoordinates.bind(this),
			'bgr',
			this.ICON_SIZE,
			0
		)

		// The original uses larger packets, and splits the payload equally across 2

		const bmpHeader = buildBMPHeader(this.ICON_SIZE, this.ICON_BYTES, 3780)
		const bytesCount = this.ICON_BYTES + bmpHeader.length
		const frame1Bytes = bytesCount / 2 - bmpHeader.length

		const packet1 = Buffer.alloc(MAX_PACKET_SIZE)
		const packet1Header = buildFillImageCommandHeader(keyIndex, 0x01, false)
		packet1.set(packet1Header, 0)
		packet1.set(bmpHeader, packet1Header.length)
		byteBuffer.copy(packet1, packet1Header.length + bmpHeader.length, 0, frame1Bytes)

		const packet2 = Buffer.alloc(MAX_PACKET_SIZE)
		const packet2Header = buildFillImageCommandHeader(keyIndex, 0x02, true)
		packet2.set(packet2Header, 0)
		byteBuffer.copy(packet2, packet2Header.length, frame1Bytes)

		return [bufferToIntArray(packet1), bufferToIntArray(packet2)]
	}

	private flipCoordinates(x: number, y: number): { x: number; y: number } {
		return { x: this.ICON_SIZE - x - 1, y }
	}
}
