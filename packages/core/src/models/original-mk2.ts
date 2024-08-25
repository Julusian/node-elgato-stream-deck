import { HIDDevice } from '../hid-device.js'
import { OpenStreamDeckOptions, StreamDeckBase } from './base.js'
import { createBaseGen2Properties, StreamDeckGen2Properties } from './generic-gen2.js'
import { DeviceModelId } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'

const origMK2Properties: StreamDeckGen2Properties = {
	MODEL: DeviceModelId.ORIGINALMK2,
	PRODUCT_NAME: 'Stream Deck MK2',
	BUTTON_WIDTH_PX: 72,
	BUTTON_HEIGHT_PX: 72,

	CONTROLS: freezeDefinitions(generateButtonsGrid(5, 3)),

	KEY_SPACING_HORIZONTAL: 25,
	KEY_SPACING_VERTICAL: 25,
}

export function StreamDeckOriginalMK2Factory(
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
): StreamDeckBase {
	const services = createBaseGen2Properties(device, options, origMK2Properties)

	return new StreamDeckBase(device, options, services)
}
