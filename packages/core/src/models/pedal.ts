import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import { PedalPropertiesService } from '../services/properties/pedal.js'
import { FakeLcdService } from '../services/buttonsLcdDisplay/fake.js'
import type { StreamDeckEvents } from '../types.js'
import { CallbackHook } from '../services/callback-hook.js'
import { ButtonOnlyInputService } from '../services/input/gen1.js'
import { pedalProperties } from './definitions.js'

export function StreamDeckPedalFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckBase {
	const events = new CallbackHook<StreamDeckEvents>()

	return new StreamDeckBase(device, options, {
		deviceProperties: pedalProperties,
		events,
		properties: new PedalPropertiesService(device),
		buttonsLcd: new FakeLcdService(),
		lcdSegmentDisplay: null,
		inputService: new ButtonOnlyInputService(pedalProperties, events),
		encoderLed: null,
	})
}
