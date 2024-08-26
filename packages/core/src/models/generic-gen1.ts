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
		HAS_NFC_READER: false,
		SUPPORTS_CHILD_DEVICES: false,
	}
}

export type StreamDeckGen1Properties = Omit<
	StreamDeckProperties,
	'KEY_DATA_OFFSET' | 'HAS_NFC_READER' | 'SUPPORTS_CHILD_DEVICES'
>

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
		parentDeviceProperties: null,
		events,
		properties: new Gen1PropertiesService(device),
		buttonsLcd: new DefaultButtonsLcdService(
			imageWriter,
			new BitmapButtonLcdImagePacker(targetOptions, bmpImagePPM),
			device,
			fullProperties,
			0,
		),
		lcdSegmentDisplay: null,
		inputService: new ButtonOnlyInputService(fullProperties, events, 0),
		encoderLed: null,
	})
}
