import { HIDDevice } from '../device'
import { OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId } from '../id'

const xlProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.XLV2,
	PRODUCT_NAME: 'Streamdeck XL',
	COLUMNS: 8,
	ROWS: 4,
	TOUCH_BUTTONS: 0,
	BUTTON_WIDTH_PX: 96,
	BUTTON_HEIGHT_PX: 96,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 3,
	ENCODER_COUNT: 0,
	SUPPORTS_RGB_KEY_FILL: true, // TODO - verify this

	KEY_SPACING_HORIZONTAL: 32,
	KEY_SPACING_VERTICAL: 39,
}

export class StreamDeckXLV2 extends StreamDeckGen2Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, xlProperties, null)
	}
}
