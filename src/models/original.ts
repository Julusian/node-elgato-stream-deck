import { BMP_HEADER_LENGTH, imageToByteArray, writeBMPHeader } from '../util'
import { OpenStreamDeckOptions, StreamDeckBase, StreamDeckProperties } from './base'
import { DeviceModelId, KeyIndex, StreamDeckDeviceInfo } from './id'

const origProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.ORIGINAL,
	COLUMNS: 5,
	ROWS: 3,
	ICON_SIZE: 72,
	KEY_DIRECTION: 'rtl',
	KEY_DATA_OFFSET: 1,
}

export class StreamDeckOriginal extends StreamDeckBase {
	private readonly useOriginalKeyOrder: boolean

	constructor(deviceInfo: StreamDeckDeviceInfo, options: OpenStreamDeckOptions) {
		super(deviceInfo, options, origProperties)

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

	protected getFillImagePacketLength(): number {
		return 8191
	}

	protected convertFillImage(sourceBuffer: Buffer, sourceOffset: number, sourceStride: number): Buffer {
		const byteBuffer = imageToByteArray(
			sourceBuffer,
			sourceOffset,
			sourceStride,
			BMP_HEADER_LENGTH,
			this.flipCoordinates.bind(this),
			'bgr',
			this.ICON_SIZE
		)
		writeBMPHeader(byteBuffer, this.ICON_SIZE, this.ICON_BYTES, 3780)
		return byteBuffer
	}

	protected generateFillImageWrites(keyIndex: KeyIndex, byteBuffer: Buffer): Buffer[] {
		const MAX_PACKET_SIZE = this.getFillImagePacketLength()
		const PACKET_HEADER_LENGTH = this.getFillImageCommandHeaderLength()

		// The original uses larger packets, and splits the payload equally across 2

		const packet1Bytes = byteBuffer.length / 2

		const packet1 = Buffer.alloc(MAX_PACKET_SIZE)
		this.writeFillImageCommandHeader(packet1, keyIndex, 0x01, false, packet1Bytes)
		byteBuffer.copy(packet1, PACKET_HEADER_LENGTH, 0, packet1Bytes)

		const packet2 = Buffer.alloc(MAX_PACKET_SIZE)
		this.writeFillImageCommandHeader(packet2, keyIndex, 0x02, true, packet1Bytes)
		byteBuffer.copy(packet2, PACKET_HEADER_LENGTH, packet1Bytes)

		return [packet1, packet2]
	}

	private flipCoordinates(x: number, y: number): { x: number; y: number } {
		return { x: this.ICON_SIZE - x - 1, y }
	}
}
