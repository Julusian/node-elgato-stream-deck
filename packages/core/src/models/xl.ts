import { HIDDevice } from '../hid-device.js'
import { OpenStreamDeckOptions, StreamDeckBase } from './base.js'
import { createBaseGen2Properties, StreamDeckGen2Properties } from './generic-gen2.js'
import { DeviceModelId } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'

const xlProperties: StreamDeckGen2Properties = {
	MODEL: DeviceModelId.XL,
	PRODUCT_NAME: 'Stream Deck XL',
	BUTTON_WIDTH_PX: 96,
	BUTTON_HEIGHT_PX: 96,

	CONTROLS: freezeDefinitions(generateButtonsGrid(8, 4)),

	KEY_SPACING_HORIZONTAL: 32,
	KEY_SPACING_VERTICAL: 39,
}

export function StreamDeckXLFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckBase {
	const services = createBaseGen2Properties(device, options, xlProperties)

	return new StreamDeckBase(device, options, services)
}
