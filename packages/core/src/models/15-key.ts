import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import type { StreamDeckGen2Properties } from './generic-gen2.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import { type DeviceModelId, MODEL_NAMES } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import type { PropertiesService } from '../services/properties/interface.js'

const base15KeyProperties: Omit<StreamDeckGen2Properties, 'model' | 'productName'> = {
	supportsRgbKeyFill: true,

	controls: freezeDefinitions(generateButtonsGrid(5, 3, { width: 72, height: 72 })),

	keySpacingHorizontal: 25,
	keySpacingVertical: 25,

	fullscreenPanels: 1,
	hasNfcReader: false,
	supportsChildDevices: false,
}

export function StreamDeck15KeyFactory(
	model: DeviceModelId,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	_tcpPropertiesService?: PropertiesService,
): StreamDeckBase {
	const properties: StreamDeckGen2Properties = {
		...base15KeyProperties,
		model: model,
		productName: MODEL_NAMES[model],
	}

	const services = createBaseGen2Properties(device, options, properties, null)

	return new StreamDeckBase(device, options, services)
}
