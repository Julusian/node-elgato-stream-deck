import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { applyModelIdentity, StreamDeckBase } from './base.js'
import { PedalPropertiesService } from '../services/properties/pedal.js'
import { FakeLcdService } from '../services/buttonsLcdDisplay/fake.js'
import type { StreamDeckEvents } from '../types.js'
import { CallbackHook } from '../services/callback-hook.js'
import { ButtonOnlyInputService } from '../services/input/gen1.js'
import type { StreamDeckModelInfo } from '../modelInfo.js'
import { pedalProperties } from './definitions.js'

export function StreamDeckPedalFactory(
	info: StreamDeckModelInfo,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
): StreamDeckBase {
	const properties = applyModelIdentity(info, pedalProperties)
	const events = new CallbackHook<StreamDeckEvents>()

	return new StreamDeckBase(device, options, {
		modelInfo: info,
		deviceProperties: properties,
		events,
		properties: new PedalPropertiesService(device),
		buttonsLcd: new FakeLcdService(),
		lcdSegmentDisplay: null,
		inputService: new ButtonOnlyInputService(properties, events),
		encoderLed: null,
	})
}
