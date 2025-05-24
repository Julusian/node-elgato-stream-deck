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
	MODEL: DeviceModelId.NETWORK_DOCK,
	PRODUCT_NAME: MODEL_NAMES[DeviceModelId.NETWORK_DOCK],
	KEY_DATA_OFFSET: 0,

	SUPPORTS_RGB_KEY_FILL: false,

	CONTROLS: freezeDefinitions([]),

	KEY_SPACING_HORIZONTAL: 0,
	KEY_SPACING_VERTICAL: 0,

	FULLSCREEN_PANELS: 0,
	HAS_NFC_READER: false,
	SUPPORTS_CHILD_DEVICES: true,
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
