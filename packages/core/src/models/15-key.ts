import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import type { StreamDeckGen2Properties } from './generic-gen2.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import { type DeviceModelId, MODEL_NAMES } from '../id.js'
import type { PropertiesService } from '../services/properties/interface.js'
import { base15KeyProperties } from './definitions.js'

export function StreamDeck15KeyFactory(
	model: DeviceModelId,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	_tcpPropertiesService?: PropertiesService,
): StreamDeckBase {
	const properties: StreamDeckGen2Properties = {
		...base15KeyProperties,
		model,
		productName: MODEL_NAMES[model],
	}

	const services = createBaseGen2Properties(device, options, properties, null)

	return new StreamDeckBase(device, options, services)
}
