import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import type { StreamDeckGen2Properties } from './generic-gen2.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import { type DeviceModelId, MODEL_NAMES } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import type { PropertiesService } from '../services/properties/interface.js'

const base32KeyProperties: Omit<StreamDeckGen2Properties, 'MODEL' | 'PRODUCT_NAME'> = {
	SUPPORTS_RGB_KEY_FILL: false, // rev2 doesn't support it, even though rev1 does

	CONTROLS: freezeDefinitions(generateButtonsGrid(8, 4, { width: 96, height: 96 })),

	KEY_SPACING_HORIZONTAL: 32,
	KEY_SPACING_VERTICAL: 39,

	FULLSCREEN_PANELS: 0,
	HAS_NFC_READER: false,
	SUPPORTS_CHILD_DEVICES: false,
}

export function StreamDeck32KeyFactory(
	model: DeviceModelId,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	_tcpPropertiesService?: PropertiesService,
): StreamDeckBase {
	const properties: StreamDeckGen2Properties = {
		...base32KeyProperties,
		MODEL: model,
		PRODUCT_NAME: MODEL_NAMES[model],
	}
	const services = createBaseGen2Properties(device, options, properties, null)

	return new StreamDeckBase(device, options, services)
}
