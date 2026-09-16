import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions, StreamDeckBase } from './base.js'
import { StreamDeckGen1Factory } from './generic-gen1.js'
import { StreamdeckDefaultImageWriter } from '../services/imageWriter/imageWriter.js'
import { StreamdeckGen1ImageHeaderGenerator } from '../services/imageWriter/headerGenerator.js'
import type { PropertiesService } from '../services/properties/interface.js'
import type { StreamDeckModelInfo } from '../modelInfo.js'
import { sixKeyProperties } from './definitions.js'

export function StreamDeck6KeyFactory(
	info: StreamDeckModelInfo,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	_tcpPropertiesService?: PropertiesService,
): StreamDeckBase {
	return StreamDeckGen1Factory(
		info,
		device,
		options,
		sixKeyProperties,
		new StreamdeckDefaultImageWriter(new StreamdeckGen1ImageHeaderGenerator()),
		{ colorMode: 'bgr', rotate: true, yFlip: true },
		2835,
	)
}
