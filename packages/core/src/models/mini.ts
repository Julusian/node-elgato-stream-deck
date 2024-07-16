import { HIDDevice } from '../hid-device'
import { BMP_HEADER_LENGTH, transformImageBuffer, writeBMPHeader } from '../util'
import { InternalFillImageOptions, OpenStreamDeckOptions, StreamDeckGen1Properties } from './base'
import { StreamDeckGen1Base } from './base-gen1'
import { DeviceModelId } from '../id'

const miniProperties: StreamDeckGen1Properties = {
	MODEL: DeviceModelId.MINI,
	PRODUCT_NAME: 'Streamdeck Mini',
	COLUMNS: 3,
	ROWS: 2,
	BUTTON_WIDTH_PX: 80,
	BUTTON_HEIGHT_PX: 80,
	KEY_DIRECTION: 'ltr',
	SUPPORTS_RGB_KEY_FILL: false, // TODO - verify this

	KEY_SPACING_HORIZONTAL: 28,
	KEY_SPACING_VERTICAL: 28,
}

export class StreamDeckMini extends StreamDeckGen1Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, miniProperties)
	}

	protected async convertFillImage(sourceBuffer: Buffer, sourceOptions: InternalFillImageOptions): Promise<Buffer> {
		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions,
			{ colorMode: 'bgr', rotate: true, yFlip: true },
			BMP_HEADER_LENGTH,
			this.BUTTON_WIDTH_PX,
			this.BUTTON_HEIGHT_PX
		)
		writeBMPHeader(byteBuffer, this.BUTTON_WIDTH_PX, this.BUTTON_HEIGHT_PX, this.BUTTON_RGB_BYTES, 2835)
		return byteBuffer
	}
}
