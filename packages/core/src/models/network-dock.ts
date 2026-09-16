import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import type { PropertiesService } from '../services/properties/interface.js'
import type { StreamDeckEvents } from '../types.js'
import { CallbackHook } from '../services/callback-hook.js'
import { FakeLcdService } from '../services/buttonsLcdDisplay/fake.js'
import { FakeInputService } from '../services/input/fake.js'
import { NetworkDockPropertiesService } from '../services/properties/network-dock.js'
import { networkDockProperties } from './definitions.js'

export function NetworkDockFactory(
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	_tcpPropertiesService?: PropertiesService,
): StreamDeckBase {
	const events = new CallbackHook<StreamDeckEvents>()

	return new StreamDeckBase(device, options, {
		deviceProperties: networkDockProperties,
		events,
		properties: new NetworkDockPropertiesService(device),
		buttonsLcd: new FakeLcdService(),
		lcdSegmentDisplay: null,
		inputService: new FakeInputService(),
		encoderLed: null,
	})
}
