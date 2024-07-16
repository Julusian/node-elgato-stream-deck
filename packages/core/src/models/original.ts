import { HIDDevice } from '../hid-device'
import { BMP_HEADER_LENGTH, transformImageBuffer, writeBMPHeader } from '../util'
import { InternalFillImageOptions, OpenStreamDeckOptions, StreamDeckGen1Properties } from './base'
import { StreamDeckGen1Base } from './base-gen1'
import { DeviceModelId } from '../id'
import { StreamdeckOriginalImageWriter } from '../services/imageWriter/imageWriter'

const originalProperties: StreamDeckGen1Properties = {
	MODEL: DeviceModelId.ORIGINAL,
	PRODUCT_NAME: 'Streamdeck',
	COLUMNS: 5,
	ROWS: 3,
	BUTTON_WIDTH_PX: 72,
	BUTTON_HEIGHT_PX: 72,
	KEY_DIRECTION: 'rtl',
	SUPPORTS_RGB_KEY_FILL: false,

	KEY_SPACING_HORIZONTAL: 25,
	KEY_SPACING_VERTICAL: 25,
}

export class StreamDeckOriginal extends StreamDeckGen1Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, originalProperties, new StreamdeckOriginalImageWriter())
	}

	protected async convertFillImage(sourceBuffer: Buffer, sourceOptions: InternalFillImageOptions): Promise<Buffer> {
		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions,
			{ colorMode: 'bgr', xFlip: true },
			BMP_HEADER_LENGTH,
			this.BUTTON_WIDTH_PX,
			this.BUTTON_HEIGHT_PX
		)
		writeBMPHeader(byteBuffer, this.BUTTON_WIDTH_PX, this.BUTTON_HEIGHT_PX, this.BUTTON_RGB_BYTES, 3780)
		return byteBuffer
	}
}
