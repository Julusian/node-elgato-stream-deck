import { HIDDevice } from '../hid-device'
import { OpenStreamDeckOptions, StreamDeckGen2Properties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId } from '../id'

const origV2Properties: StreamDeckGen2Properties = {
	MODEL: DeviceModelId.ORIGINALV2,
	PRODUCT_NAME: 'Streamdeck',
	COLUMNS: 5,
	ROWS: 3,
	TOUCH_BUTTONS: 0,
	BUTTON_WIDTH_PX: 72,
	BUTTON_HEIGHT_PX: 72,
	ENCODER_COUNT: 0,
	// SUPPORTS_RGB_KEY_FILL: false, // TODO - verify SUPPORTS_RGB_KEY_FILL

	KEY_SPACING_HORIZONTAL: 25,
	KEY_SPACING_VERTICAL: 25,
}

export class StreamDeckOriginalV2 extends StreamDeckGen2Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, origV2Properties, null)
	}
}
