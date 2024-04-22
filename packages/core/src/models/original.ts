import { HIDDevice } from '../device'
import { BMP_HEADER_LENGTH, imageToByteArray, writeBMPHeader } from '../util'
import { InternalFillImageOptions, OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen1Base } from './base-gen1'
import { DeviceModelId, KeyIndex } from '../id'

const originalProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.ORIGINAL,
	PRODUCT_NAME: 'Streamdeck',
	COLUMNS: 5,
	ROWS: 3,
	TOUCH_BUTTONS: 0,
	ICON_SIZE: 72,
	KEY_DIRECTION: 'rtl',
	KEY_DATA_OFFSET: 0,

	KEY_SPACING_HORIZONTAL: 25,
	KEY_SPACING_VERTICAL: 25,
}

export class StreamDeckOriginal extends StreamDeckGen1Base {
	private readonly useOriginalKeyOrder: boolean

	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, originalProperties)

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

	protected async convertFillImage(sourceBuffer: Buffer, sourceOptions: InternalFillImageOptions): Promise<Buffer> {
		const byteBuffer = imageToByteArray(
			sourceBuffer,
			sourceOptions,
			{ colorMode: 'bgr', xFlip: true },
			BMP_HEADER_LENGTH,
			this.ICON_SIZE
		)
		writeBMPHeader(byteBuffer, this.ICON_SIZE, this.ICON_BYTES, 3780)
		return Promise.resolve(byteBuffer)
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
}
