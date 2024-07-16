import { HIDDevice } from '../hid-device'
import { OpenStreamDeckOptions } from './base'
import { StreamDeckGen2, StreamDeckGen2Properties } from './generic-gen2'
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

export function StreamDeckOriginalMK2Factory(
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>
): StreamDeckGen2 {
	return new StreamDeckGen2(device, options, origMK2Properties, null)
}
