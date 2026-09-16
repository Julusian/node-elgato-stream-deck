import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions, StreamDeckProperties } from './base.js'
import { StreamDeckBase } from './base.js'
import { DeviceModelId, MODEL_NAMES } from '../id.js'
import { freezeDefinitions } from '../controlsGenerator.js'
import type { PropertiesService } from '../services/properties/interface.js'
import type { StreamDeckEvents } from '../types.js'
import { CallbackHook } from '../services/callback-hook.js'
import { FakeLcdService } from '../services/buttonsLcdDisplay/fake.js'
import { FakeInputService } from '../services/input/fake.js'
import { NetworkDockPropertiesService } from '../services/properties/network-dock.js'

const networkDockProperties: StreamDeckProperties = {
	model: DeviceModelId.NETWORK_DOCK,
	productName: MODEL_NAMES[DeviceModelId.NETWORK_DOCK],
	keyDataOffset: 0,

	supportsRgbKeyFill: false,

	controls: freezeDefinitions([]),

	keySpacingHorizontal: 0,
	keySpacingVertical: 0,

	fullscreenPanels: 0,
	hasNfcReader: false,
	supportsChildDevices: true,
}

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
