import { HIDDevice } from '../hid-device'
import { OpenStreamDeckOptions, StreamDeckBase } from './base'
import { StreamDeckGen1Factory, StreamDeckGen1Properties } from './generic-gen1'
import { DeviceModelId } from '../id'
import { StreamdeckOriginalImageWriter } from '../services/imageWriter/imageWriter'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator'

const originalProperties: StreamDeckGen1Properties = {
	MODEL: DeviceModelId.ORIGINAL,
	PRODUCT_NAME: 'Stream Deck',
	BUTTON_WIDTH_PX: 72,
	BUTTON_HEIGHT_PX: 72,
	SUPPORTS_RGB_KEY_FILL: false,

	CONTROLS: freezeDefinitions(generateButtonsGrid(5, 3, true)),

	KEY_SPACING_HORIZONTAL: 25,
	KEY_SPACING_VERTICAL: 25,
}

export function StreamDeckOriginalFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckBase {
	return StreamDeckGen1Factory(
		device,
		options,
		originalProperties,
		new StreamdeckOriginalImageWriter(),
		{ colorMode: 'bgr', xFlip: true },
		3780
	)
}
