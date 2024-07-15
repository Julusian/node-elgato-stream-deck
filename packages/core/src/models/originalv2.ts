import { HIDDevice } from '../device'
import { OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId } from '../id'

const origV2Properties: StreamDeckProperties = {
	MODEL: DeviceModelId.ORIGINALV2,
	PRODUCT_NAME: 'Streamdeck',
	COLUMNS: 5,
	ROWS: 3,
	TOUCH_BUTTONS: 0,
	BUTTON_WIDTH_PX: 72,
	BUTTON_HEIGHT_PX: 72,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 3,
	ENCODER_COUNT: 0,
	SUPPORTS_RGB_KEY_FILL: false,

	KEY_SPACING_HORIZONTAL: 25,
	KEY_SPACING_VERTICAL: 25,
}

export class StreamDeckOriginalV2 extends StreamDeckGen2Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, origV2Properties, null)
	}
}
