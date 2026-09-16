import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import { PedalPropertiesService } from '../services/properties/pedal.js'
import { FakeLcdService } from '../services/buttonsLcdDisplay/fake.js'
import type { StreamDeckEvents } from '../types.js'
import { CallbackHook } from '../services/callback-hook.js'
import { ButtonOnlyInputService } from '../services/input/gen1.js'
import type { StreamDeckModelDefinition } from '../modelInfo.js'

export function StreamDeckPedalFactory(
	definition: StreamDeckModelDefinition,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
): StreamDeckBase {
	const events = new CallbackHook<StreamDeckEvents>()

	return new StreamDeckBase(device, options, {
		modelInfo: definition.info,
		deviceProperties: definition.properties,
		events,
		properties: new PedalPropertiesService(device),
		buttonsLcd: new FakeLcdService(),
		lcdSegmentDisplay: null,
		inputService: new ButtonOnlyInputService(definition.properties, events),
		encoderLed: null,
	})
}
