import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import type { StreamDeckGen2Properties } from './generic-gen2.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import { DeviceModelId, MODEL_NAMES } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'

const origMK2Properties: StreamDeckGen2Properties = {
	MODEL: DeviceModelId.ORIGINALMK2,
	PRODUCT_NAME: MODEL_NAMES[DeviceModelId.ORIGINALMK2],

	CONTROLS: freezeDefinitions(generateButtonsGrid(5, 3, { width: 72, height: 72 })),

	KEY_SPACING_HORIZONTAL: 25,
	KEY_SPACING_VERTICAL: 25,

	FULLSCREEN_PANELS: 0,
	HAS_NFC_READER: false,
	SUPPORTS_CHILD_DEVICES: false,
}

export function StreamDeckOriginalMK2Factory(
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
): StreamDeckBase {
	const services = createBaseGen2Properties(device, options, origMK2Properties, null, null)

	return new StreamDeckBase(device, options, services)
}
