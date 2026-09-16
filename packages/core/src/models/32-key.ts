import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import type { StreamDeckGen2Properties } from './generic-gen2.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import { type DeviceModelId, MODEL_NAMES } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import type { PropertiesService } from '../services/properties/interface.js'

const base32KeyProperties: Omit<StreamDeckGen2Properties, 'model' | 'productName'> = {
	supportsRgbKeyFill: true,

	controls: freezeDefinitions(generateButtonsGrid(8, 4, { width: 96, height: 96 })),

	keySpacingHorizontal: 32,
	keySpacingVertical: 39,

	fullscreenPanels: 1,
	hasNfcReader: false,
	supportsChildDevices: false,
}

export function StreamDeck32KeyFactory(
	model: DeviceModelId,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	_tcpPropertiesService?: PropertiesService,
): StreamDeckBase {
	const properties: StreamDeckGen2Properties = {
		...base32KeyProperties,
		model: model,
		productName: MODEL_NAMES[model],
	}
	const services = createBaseGen2Properties(device, options, properties, null)

	return new StreamDeckBase(device, options, services)
}
