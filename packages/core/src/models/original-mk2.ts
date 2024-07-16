import { HIDDevice } from '../hid-device'
import { OpenStreamDeckOptions, StreamDeckGen2Properties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId } from '../id'

const origMK2Properties: StreamDeckGen2Properties = {
	MODEL: DeviceModelId.ORIGINALMK2,
	PRODUCT_NAME: 'Streamdeck MK2',
	COLUMNS: 5,
	ROWS: 3,
	TOUCH_BUTTONS: 0,
	BUTTON_WIDTH_PX: 72,
	BUTTON_HEIGHT_PX: 72,
	ENCODER_COUNT: 0,

	KEY_SPACING_HORIZONTAL: 25,
	KEY_SPACING_VERTICAL: 25,
}

export class StreamDeckOriginalMK2 extends StreamDeckGen2Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, origMK2Properties, null)
	}
}
