import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import type { PropertiesService } from '../services/properties/interface.js'
import type { StreamDeckModelDefinition } from '../modelInfo.js'

export function StreamDeck15KeyFactory(
	definition: StreamDeckModelDefinition,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	_tcpPropertiesService?: PropertiesService,
): StreamDeckBase {
	const services = createBaseGen2Properties(definition, device, options, null)

	return new StreamDeckBase(device, options, services)
}
