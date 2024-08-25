import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions, StreamDeckProperties } from './base.js'
import { StreamDeckBase } from './base.js'
import { DeviceModelId } from '../id.js'
import type { StreamDeckControlDefinition } from '../controlDefinition.js'
import { freezeDefinitions } from '../controlsGenerator.js'
import { PedalPropertiesService } from '../services/properties/pedal.js'
import { PedalLcdService } from '../services/buttonsLcdDisplay/pedal.js'

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
	PRODUCT_NAME: 'Stream Deck Pedal',
	BUTTON_WIDTH_PX: 0,
	BUTTON_HEIGHT_PX: 0,
	KEY_DATA_OFFSET: 3,
	SUPPORTS_RGB_KEY_FILL: false,

	CONTROLS: freezeDefinitions(pedalControls),

	KEY_SPACING_HORIZONTAL: 0,
	KEY_SPACING_VERTICAL: 0,
}

export function StreamDeckPedalFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckBase {
	return new StreamDeckBase(device, options, {
		deviceProperties: pedalProperties,
		events: null,
		properties: new PedalPropertiesService(device),
		buttonsLcd: new PedalLcdService(),
		lcdStripDisplay: null,
		lcdStripInput: null,
		encoderInput: null,
	})
}
