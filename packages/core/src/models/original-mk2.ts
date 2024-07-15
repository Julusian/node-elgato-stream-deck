import { HIDDevice } from '../device'
import { OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId } from '../id'

const origMK2Properties: StreamDeckProperties = {
	MODEL: DeviceModelId.ORIGINALMK2,
	PRODUCT_NAME: 'Streamdeck MK2',
	COLUMNS: 5,
	ROWS: 3,
	TOUCH_BUTTONS: 0,
	BUTTON_WIDTH_PX: 72,
	BUTTON_HEIGHT_PX: 72,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 3,
	ENCODER_COUNT: 0,
	SUPPORTS_RGB_KEY_FILL: true,

	KEY_SPACING_HORIZONTAL: 25,
	KEY_SPACING_VERTICAL: 25,
}

export class StreamDeckOriginalMK2 extends StreamDeckGen2Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, origMK2Properties, null)
	}
}
