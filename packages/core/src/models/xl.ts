import { HIDDevice } from '../hid-device'
import { OpenStreamDeckOptions } from './base'
import { StreamDeckGen2, StreamDeckGen2Properties } from './generic-gen2'
import { DeviceModelId } from '../id'

const xlProperties: StreamDeckGen2Properties = {
	MODEL: DeviceModelId.XL,
	PRODUCT_NAME: 'Streamdeck XL',
	COLUMNS: 8,
	ROWS: 4,
	TOUCH_BUTTONS: 0,
	BUTTON_WIDTH_PX: 96,
	BUTTON_HEIGHT_PX: 96,
	ENCODER_COUNT: 0,

	KEY_SPACING_HORIZONTAL: 32,
	KEY_SPACING_VERTICAL: 39,
}

export function StreamDeckXLFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckGen2 {
	return new StreamDeckGen2(device, options, xlProperties, null)
}
