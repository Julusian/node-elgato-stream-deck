import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import type { StreamDeckModelDefinition } from '../modelInfo.js'
import type { StreamdeckImageWriter } from '../services/imageWriter/types.js'
import type { FillImageTargetOptions } from '../util.js'
import { Gen1PropertiesService } from '../services/properties/gen1.js'
import { DefaultButtonsLcdService } from '../services/buttonsLcdDisplay/default.js'
import { BitmapButtonLcdImagePacker } from '../services/imagePacker/bitmap.js'
import { CallbackHook } from '../services/callback-hook.js'
import type { StreamDeckEvents } from '../types.js'
import { ButtonOnlyInputService } from '../services/input/gen1.js'

export function StreamDeckGen1Factory(
	definition: StreamDeckModelDefinition,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	imageWriter: StreamdeckImageWriter,
	targetOptions: FillImageTargetOptions,
	bmpImagePPM: number,
): StreamDeckBase {
	const fullProperties = definition.properties

	const events = new CallbackHook<StreamDeckEvents>()

	return new StreamDeckBase(device, options, {
		modelInfo: definition.info,
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
