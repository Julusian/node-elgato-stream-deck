import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions, StreamDeckBase } from './base.js'
import type { StreamDeckGen1Properties } from './generic-gen1.js'
import { StreamDeckGen1Factory } from './generic-gen1.js'
import { type DeviceModelId, MODEL_NAMES } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import { StreamdeckDefaultImageWriter } from '../services/imageWriter/imageWriter.js'
import { StreamdeckGen1ImageHeaderGenerator } from '../services/imageWriter/headerGenerator.js'
import type { PropertiesService } from '../services/properties/interface.js'

const base6KeyProperties: Omit<StreamDeckGen1Properties, 'MODEL' | 'PRODUCT_NAME'> = {
	SUPPORTS_RGB_KEY_FILL: false, // TODO - verify this

	CONTROLS: freezeDefinitions(generateButtonsGrid(3, 2, { width: 80, height: 80 })),

	KEY_SPACING_HORIZONTAL: 28,
	KEY_SPACING_VERTICAL: 28,

	FULLSCREEN_PANELS: 0,
}

export function StreamDeck6KeyFactory(
	model: DeviceModelId,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	_tcpPropertiesService?: PropertiesService,
): StreamDeckBase {
	const properties: StreamDeckGen1Properties = {
		...base6KeyProperties,
		MODEL: model,
		PRODUCT_NAME: MODEL_NAMES[model],
	}

	return StreamDeckGen1Factory(
		device,
		options,
		properties,
		new StreamdeckDefaultImageWriter(new StreamdeckGen1ImageHeaderGenerator()),
		{ colorMode: 'bgr', rotate: true, yFlip: true },
		2835,
	)
}
