import type { HIDDevice } from '../hid-device.js'
import { StreamDeckBase, type OpenStreamDeckOptions } from './base.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import type { PropertiesService } from '../services/properties/interface.js'
import { StudioPropertiesService } from '../services/properties/studio.js'
import { StudioEncoderLedService } from '../services/encoderLed/studio.js'
import { studioProperties } from './definitions.js'

export function StreamDeckStudioFactory(
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	propertiesService?: PropertiesService,
): StreamDeckBase {
	const services = createBaseGen2Properties(
		device,
		options,
		studioProperties,
		propertiesService ?? new StudioPropertiesService(device),
		{ xFlip: false, yFlip: false },
	)
	services.encoderLed = new StudioEncoderLedService(device, studioProperties.controls)

	return new StreamDeckBase(device, options, services)
}
