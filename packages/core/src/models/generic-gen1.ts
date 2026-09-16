import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions, StreamDeckProperties, StreamDeckStaticProperties } from './base.js'
import { applyModelIdentity, StreamDeckBase } from './base.js'
import type { StreamDeckModelInfo } from '../modelInfo.js'
import type { StreamdeckImageWriter } from '../services/imageWriter/types.js'
import type { FillImageTargetOptions } from '../util.js'
import { Gen1PropertiesService } from '../services/properties/gen1.js'
import { DefaultButtonsLcdService } from '../services/buttonsLcdDisplay/default.js'
import { BitmapButtonLcdImagePacker } from '../services/imagePacker/bitmap.js'
import { CallbackHook } from '../services/callback-hook.js'
import type { StreamDeckEvents } from '../types.js'
import { ButtonOnlyInputService } from '../services/input/gen1.js'

function extendDevicePropertiesForGen1(
	info: StreamDeckModelInfo,
	rawProps: StreamDeckGen1Properties,
): StreamDeckProperties {
	return applyModelIdentity(info, {
		...rawProps,
		keyDataOffset: 0,
		hasNfcReader: false,
		supportsChildDevices: false,
	})
}

export type StreamDeckGen1Properties = Omit<
	StreamDeckStaticProperties,
	'keyDataOffset' | 'hasNfcReader' | 'supportsChildDevices'
>

export function StreamDeckGen1Factory(
	info: StreamDeckModelInfo,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	properties: StreamDeckGen1Properties,
	imageWriter: StreamdeckImageWriter,
	targetOptions: FillImageTargetOptions,
	bmpImagePPM: number,
): StreamDeckBase {
	const fullProperties = extendDevicePropertiesForGen1(info, properties)

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
		encoderLed: null,
	})
}
