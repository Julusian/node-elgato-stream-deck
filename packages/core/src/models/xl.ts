import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import type { StreamDeckGen2Properties } from './generic-gen2.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import { DeviceModelId, MODEL_NAMES } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'

const xlProperties: StreamDeckGen2Properties = {
	MODEL: DeviceModelId.XL,
	PRODUCT_NAME: MODEL_NAMES[DeviceModelId.XL],

	CONTROLS: freezeDefinitions(generateButtonsGrid(8, 4, { width: 96, height: 96 })),

	KEY_SPACING_HORIZONTAL: 32,
	KEY_SPACING_VERTICAL: 39,

	FULLSCREEN_PANELS: 0,
	HAS_NFC_READER: false,
	SUPPORTS_CHILD_DEVICES: false,
}

export function StreamDeckXLFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckBase {
	const services = createBaseGen2Properties(device, options, xlProperties, null, null)

	return new StreamDeckBase(device, options, services)
}
