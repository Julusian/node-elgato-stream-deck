import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import type { StreamDeckGen2Properties } from './generic-gen2.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import { DeviceModelId } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'

const origV2Properties: StreamDeckGen2Properties = {
	MODEL: DeviceModelId.ORIGINALV2,
	PRODUCT_NAME: 'Stream Deck',
	BUTTON_WIDTH_PX: 72,
	BUTTON_HEIGHT_PX: 72,
	// SUPPORTS_RGB_KEY_FILL: false, // TODO - verify SUPPORTS_RGB_KEY_FILL

	CONTROLS: freezeDefinitions(generateButtonsGrid(5, 3)),

	KEY_SPACING_HORIZONTAL: 25,
	KEY_SPACING_VERTICAL: 25,
}

export function StreamDeckOriginalV2Factory(
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
): StreamDeckBase {
	const services = createBaseGen2Properties(device, options, origV2Properties)

	return new StreamDeckBase(device, options, services)
}
