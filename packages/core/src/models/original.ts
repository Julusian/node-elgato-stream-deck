import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions, StreamDeckBase } from './base.js'
import { StreamDeckGen1Factory } from './generic-gen1.js'
import { StreamdeckOriginalImageWriter } from '../services/imageWriter/imageWriter.js'
import type { StreamDeckModelDefinition } from '../modelInfo.js'

export function StreamDeckOriginalFactory(
	definition: StreamDeckModelDefinition,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
): StreamDeckBase {
	return StreamDeckGen1Factory(
		definition,
		device,
		options,
		new StreamdeckOriginalImageWriter(),
		{ colorMode: 'bgr', xFlip: true },
		3780,
	)
}
