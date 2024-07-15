import { HIDDevice } from '../device'
import { BMP_HEADER_LENGTH, transformImageBuffer, writeBMPHeader } from '../util'
import { InternalFillImageOptions, OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen1Base } from './base-gen1'
import { DeviceModelId, KeyIndex } from '../id'
import { StreamdeckOriginalImageWriter } from '../imageWriter/imageWriter'

const originalProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.ORIGINAL,
	PRODUCT_NAME: 'Streamdeck',
	COLUMNS: 5,
	ROWS: 3,
	TOUCH_BUTTONS: 0,
	ICON_SIZE: 72,
	KEY_DIRECTION: 'rtl',
	KEY_DATA_OFFSET: 0,
	ENCODER_COUNT: 0,

	KEY_SPACING_HORIZONTAL: 25,
	KEY_SPACING_VERTICAL: 25,
}

export class StreamDeckOriginal extends StreamDeckGen1Base {
	private readonly useOriginalKeyOrder: boolean

	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, originalProperties, new StreamdeckOriginalImageWriter())

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

	protected async convertFillImage(sourceBuffer: Buffer, sourceOptions: InternalFillImageOptions): Promise<Buffer> {
		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions,
			{ colorMode: 'bgr', xFlip: true },
			BMP_HEADER_LENGTH,
			this.ICON_SIZE
		)
		writeBMPHeader(byteBuffer, this.ICON_SIZE, this.ICON_BYTES, 3780)
		return Promise.resolve(byteBuffer)
	}
}
