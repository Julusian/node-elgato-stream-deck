import type { HIDDevice } from '../hid-device.js'
import { StreamDeckBase, type OpenStreamDeckOptions } from './base.js'
import { createBaseGen2Properties, type StreamDeckGen2Properties } from './generic-gen2.js'
import { DeviceModelId, MODEL_NAMES } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import type { StreamDeckControlDefinition } from '../controlDefinition.js'
import type { PropertiesService } from '../services/properties/interface.js'

const studioControls: StreamDeckControlDefinition[] = [
	{
		type: 'encoder',
		row: 0,
		column: 0,
		index: 0,
		hidIndex: 0,

		hasLed: true,
		ledRingSteps: 24,
	},
	...generateButtonsGrid(16, 2, { width: 144, height: 112 }, false, 1),
	{
		type: 'encoder',
		row: 0,
		column: 17,
		index: 1,
		hidIndex: 1,

		hasLed: true,
		ledRingSteps: 24,
	},
]

export const studioProperties: StreamDeckGen2Properties = {
	MODEL: DeviceModelId.STUDIO,
	PRODUCT_NAME: MODEL_NAMES[DeviceModelId.STUDIO],

	CONTROLS: freezeDefinitions(studioControls),

	KEY_SPACING_HORIZONTAL: 0, // TODO
	KEY_SPACING_VERTICAL: 0, // TODO

	FULLSCREEN_PANELS: 2,

	HAS_NFC_READER: true,
	SUPPORTS_CHILD_DEVICES: true,
}

export function StreamDeckStudioFactory(
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	propertiesService?: PropertiesService,
): StreamDeckBase {
	const services = createBaseGen2Properties(device, options, studioProperties, propertiesService ?? null, true)
	return new StreamDeckBase(device, options, services)
}
