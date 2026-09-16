import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions, StreamDeckBase } from './base.js'
import { StreamDeckGen1Factory } from './generic-gen1.js'
import { StreamdeckOriginalImageWriter } from '../services/imageWriter/imageWriter.js'
import { originalProperties } from './definitions.js'

export function StreamDeckOriginalFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckBase {
	return StreamDeckGen1Factory(
		device,
		options,
		originalProperties,
		new StreamdeckOriginalImageWriter(),
		{ colorMode: 'bgr', xFlip: true },
		3780,
	)
}
