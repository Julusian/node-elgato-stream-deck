import { HIDDevice } from '../hid-device'
import { OpenStreamDeckOptions } from './base'
import { StreamDeckGen2, StreamDeckGen2Properties } from './generic-gen2'
import { DeviceModelId } from '../id'
import { freezeDefinitions, generateButtonsGrid } from './controlsGenerator'

const xlProperties: StreamDeckGen2Properties = {
	MODEL: DeviceModelId.XL,
	PRODUCT_NAME: 'Streamdeck XL',
	BUTTON_WIDTH_PX: 96,
	BUTTON_HEIGHT_PX: 96,

	CONTROLS: freezeDefinitions(generateButtonsGrid(8, 4)),

	KEY_SPACING_HORIZONTAL: 32,
	KEY_SPACING_VERTICAL: 39,
}

export function StreamDeckXLFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckGen2 {
	return new StreamDeckGen2(device, options, xlProperties, null, null)
}
