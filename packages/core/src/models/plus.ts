import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import type { StreamDeckLcdSegmentControlDefinition } from '../controlDefinition.js'
import { StreamdeckDefaultLcdService } from '../services/lcdSegmentDisplay/generic.js'
import type { StreamDeckModelDefinition } from '../modelInfo.js'

export function StreamDeckPlusFactory(
	definition: StreamDeckModelDefinition,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
): StreamDeckBase {
	const services = createBaseGen2Properties(definition, device, options, null, { xFlip: false, yFlip: false })
	services.lcdSegmentDisplay = new StreamdeckDefaultLcdService(
		options.encodeJPEG,
		device,
		definition.properties.controls.filter(
			(control): control is StreamDeckLcdSegmentControlDefinition => control.type === 'lcd-segment',
		),
		false,
		definition.info.id,
	)

	return new StreamDeckBase(device, options, services)
}
