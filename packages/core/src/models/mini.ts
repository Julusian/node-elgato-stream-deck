import { HIDDevice } from '../hid-device.js'
import { OpenStreamDeckOptions, StreamDeckBase } from './base.js'
import { StreamDeckGen1Factory, StreamDeckGen1Properties } from './generic-gen1.js'
import { DeviceModelId } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import { StreamdeckDefaultImageWriter } from '../services/imageWriter/imageWriter.js'
import { StreamdeckGen1ImageHeaderGenerator } from '../services/imageWriter/headerGenerator.js'

const miniProperties: StreamDeckGen1Properties = {
	MODEL: DeviceModelId.MINI,
	PRODUCT_NAME: 'Stream Deck Mini',
	BUTTON_WIDTH_PX: 80,
	BUTTON_HEIGHT_PX: 80,
	SUPPORTS_RGB_KEY_FILL: false, // TODO - verify this

	CONTROLS: freezeDefinitions(generateButtonsGrid(3, 2)),

	KEY_SPACING_HORIZONTAL: 28,
	KEY_SPACING_VERTICAL: 28,
}

export function StreamDeckMiniFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckBase {
	return StreamDeckGen1Factory(
		device,
		options,
		miniProperties,
		new StreamdeckDefaultImageWriter(new StreamdeckGen1ImageHeaderGenerator()),
		{ colorMode: 'bgr', rotate: true, yFlip: true },
		2835,
	)
}
