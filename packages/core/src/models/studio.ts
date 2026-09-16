import type { HIDDevice } from '../hid-device.js'
import { StreamDeckBase, type OpenStreamDeckOptions } from './base.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import type { PropertiesService } from '../services/properties/interface.js'
import { StudioPropertiesService } from '../services/properties/studio.js'
import { StudioEncoderLedService } from '../services/encoderLed/studio.js'
import type { StreamDeckModelDefinition } from '../modelInfo.js'

export function StreamDeckStudioFactory(
	definition: StreamDeckModelDefinition,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	propertiesService?: PropertiesService,
): StreamDeckBase {
	const services = createBaseGen2Properties(
		definition,
		device,
		options,
		propertiesService ?? new StudioPropertiesService(device),
		{ xFlip: false, yFlip: false },
	)
	services.encoderLed = new StudioEncoderLedService(device, definition.properties.controls)

	return new StreamDeckBase(device, options, services)
}
