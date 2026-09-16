import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import type { StreamDeckLcdSegmentControlDefinition } from '../controlDefinition.js'
import { StreamDeckNeoLcdService } from '../services/lcdSegmentDisplay/neo.js'
import type { StreamDeckModelDefinition } from '../modelInfo.js'

export function StreamDeckNeoFactory(
	definition: StreamDeckModelDefinition,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
): StreamDeckBase {
	const services = createBaseGen2Properties(definition, device, options, null)
	services.lcdSegmentDisplay = new StreamDeckNeoLcdService(
		options.encodeJPEG,
		device,
		definition.properties.controls.filter(
			(control): control is StreamDeckLcdSegmentControlDefinition => control.type === 'lcd-segment',
		),
	)

	return new StreamDeckBase(device, options, services)
}
