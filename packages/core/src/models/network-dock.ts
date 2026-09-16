import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import type { PropertiesService } from '../services/properties/interface.js'
import type { StreamDeckEvents } from '../types.js'
import { CallbackHook } from '../services/callback-hook.js'
import { FakeLcdService } from '../services/buttonsLcdDisplay/fake.js'
import { FakeInputService } from '../services/input/fake.js'
import { NetworkDockPropertiesService } from '../services/properties/network-dock.js'
import type { StreamDeckModelDefinition } from '../modelInfo.js'

export function NetworkDockFactory(
	definition: StreamDeckModelDefinition,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	_tcpPropertiesService?: PropertiesService,
): StreamDeckBase {
	const events = new CallbackHook<StreamDeckEvents>()

	return new StreamDeckBase(device, options, {
		modelInfo: definition.info,
		deviceProperties: definition.properties,
		events,
		properties: new NetworkDockPropertiesService(device),
		buttonsLcd: new FakeLcdService(),
		lcdSegmentDisplay: null,
		inputService: new FakeInputService(),
		encoderLed: null,
	})
}
