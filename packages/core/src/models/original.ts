import { HIDDevice } from '../hid-device'
import { OpenStreamDeckOptions } from './base'
import { StreamDeckGen1, StreamDeckGen1Properties } from './generic-gen1'
import { DeviceModelId } from '../id'
import { StreamdeckOriginalImageWriter } from '../services/imageWriter/imageWriter'
import { freezeDefinitions, generateButtonsGrid } from './controlsGenerator'

const originalProperties: StreamDeckGen1Properties = {
	MODEL: DeviceModelId.ORIGINAL,
	PRODUCT_NAME: 'Streamdeck',
	COLUMNS: 5,
	ROWS: 3,
	BUTTON_WIDTH_PX: 72,
	BUTTON_HEIGHT_PX: 72,
	KEY_DIRECTION: 'rtl',
	SUPPORTS_RGB_KEY_FILL: false,

	CONTROLS: freezeDefinitions(generateButtonsGrid(5, 3)),

	KEY_SPACING_HORIZONTAL: 25,
	KEY_SPACING_VERTICAL: 25,
}

export function StreamDeckOriginalFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckGen1 {
	return new StreamDeckGen1(
		device,
		options,
		originalProperties,
		{ colorMode: 'bgr', xFlip: true },
		3780,
		new StreamdeckOriginalImageWriter()
	)
}
