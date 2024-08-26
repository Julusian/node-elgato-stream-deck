import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions, StreamDeckProperties } from './base.js'
import { StreamDeckBase } from './base.js'
import type { StreamdeckImageWriter } from '../services/imageWriter/types.js'
import type { FillImageTargetOptions } from '../util.js'
import { Gen1PropertiesService } from '../services/properties/gen1.js'
import { DefaultButtonsLcdService } from '../services/buttonsLcdDisplay/default.js'
import { BitmapButtonLcdImagePacker } from '../services/imagePacker/bitmap.js'
import { CallbackHook } from '../services/callback-hook.js'
import type { StreamDeckEvents } from '../types.js'
import { ButtonOnlyInputService } from '../services/input/gen1.js'

function extendDevicePropertiesForGen1(rawProps: StreamDeckGen1Properties): StreamDeckProperties {
	return {
		...rawProps,
		KEY_DATA_OFFSET: 0,
	}
}

export type StreamDeckGen1Properties = Omit<StreamDeckProperties, 'KEY_DATA_OFFSET'>

export function StreamDeckGen1Factory(
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	properties: StreamDeckGen1Properties,
	imageWriter: StreamdeckImageWriter,
	targetOptions: FillImageTargetOptions,
	bmpImagePPM: number,
): StreamDeckBase {
	const fullProperties = extendDevicePropertiesForGen1(properties)

	const events = new CallbackHook<StreamDeckEvents>()

	return new StreamDeckBase(device, options, {
		deviceProperties: fullProperties,
		events,
		properties: new Gen1PropertiesService(device),
		buttonsLcd: new DefaultButtonsLcdService(
			imageWriter,
			new BitmapButtonLcdImagePacker(targetOptions, bmpImagePPM),
			device,
			fullProperties,
		),
		lcdSegmentDisplay: null,
		inputService: new ButtonOnlyInputService(fullProperties, events),
	})
}
