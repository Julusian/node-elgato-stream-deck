import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions, StreamDeckBase } from './base.js'
import type { StreamDeckGen1Properties } from './generic-gen1.js'
import { StreamDeckGen1Factory } from './generic-gen1.js'
import { type DeviceModelId, MODEL_NAMES } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import { StreamdeckDefaultImageWriter } from '../services/imageWriter/imageWriter.js'
import { StreamdeckGen1ImageHeaderGenerator } from '../services/imageWriter/headerGenerator.js'
import type { PropertiesService } from '../services/properties/interface.js'

const base6KeyProperties: Omit<StreamDeckGen1Properties, 'model' | 'productName'> = {
	supportsRgbKeyFill: false, // TODO - verify this

	controls: freezeDefinitions(generateButtonsGrid(3, 2, { width: 80, height: 80 })),

	keySpacingHorizontal: 28,
	keySpacingVertical: 28,

	fullscreenPanels: 0,
}

export function StreamDeck6KeyFactory(
	model: DeviceModelId,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	_tcpPropertiesService?: PropertiesService,
): StreamDeckBase {
	const properties: StreamDeckGen1Properties = {
		...base6KeyProperties,
		model: model,
		productName: MODEL_NAMES[model],
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
