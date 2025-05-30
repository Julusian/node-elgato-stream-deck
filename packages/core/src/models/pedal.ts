import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions, StreamDeckProperties } from './base.js'
import { StreamDeckBase } from './base.js'
import { DeviceModelId, MODEL_NAMES } from '../id.js'
import type { StreamDeckControlDefinition } from '../controlDefinition.js'
import { freezeDefinitions } from '../controlsGenerator.js'
import { PedalPropertiesService } from '../services/properties/pedal.js'
import { FakeLcdService } from '../services/buttonsLcdDisplay/fake.js'
import type { StreamDeckEvents } from '../types.js'
import { CallbackHook } from '../services/callback-hook.js'
import { ButtonOnlyInputService } from '../services/input/gen1.js'

const pedalControls: StreamDeckControlDefinition[] = [
	{
		type: 'button',
		row: 0,
		column: 0,
		index: 0,
		hidIndex: 0,
		feedbackType: 'none',
	},
	{
		type: 'button',
		row: 0,
		column: 1,
		index: 1,
		hidIndex: 1,
		feedbackType: 'none',
	},
	{
		type: 'button',
		row: 0,
		column: 2,
		index: 2,
		hidIndex: 2,
		feedbackType: 'none',
	},
]

const pedalProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.PEDAL,
	PRODUCT_NAME: MODEL_NAMES[DeviceModelId.PEDAL],
	KEY_DATA_OFFSET: 3,
	SUPPORTS_RGB_KEY_FILL: false,

	CONTROLS: freezeDefinitions(pedalControls),

	KEY_SPACING_HORIZONTAL: 0,
	KEY_SPACING_VERTICAL: 0,

	FULLSCREEN_PANELS: 0,
	HAS_NFC_READER: false,
	SUPPORTS_CHILD_DEVICES: false,
}

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
