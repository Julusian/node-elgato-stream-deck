import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import type { PropertiesService } from '../services/properties/interface.js'
import type { StreamDeckModelInfo } from '../modelInfo.js'
import { thirtyTwoKeyProperties } from './definitions.js'

export function StreamDeck32KeyFactory(
	info: StreamDeckModelInfo,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	_tcpPropertiesService?: PropertiesService,
): StreamDeckBase {
	const services = createBaseGen2Properties(info, device, options, thirtyTwoKeyProperties, null)

	return new StreamDeckBase(device, options, services)
}
