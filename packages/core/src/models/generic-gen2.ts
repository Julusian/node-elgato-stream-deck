import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions, StreamDeckServicesDefinition } from './base.js'
import type { StreamDeckModelDefinition } from '../modelInfo.js'
import { StreamdeckDefaultImageWriter } from '../services/imageWriter/imageWriter.js'
import { StreamdeckGen2ImageHeaderGenerator } from '../services/imageWriter/headerGenerator.js'
import { DefaultButtonsLcdService } from '../services/buttonsLcdDisplay/default.js'
import { CallbackHook } from '../services/callback-hook.js'
import type { StreamDeckEvents } from '../types.js'
import { Gen2PropertiesService } from '../services/properties/gen2.js'
import type { JpegPackerTransformOptions } from '../services/imagePacker/jpeg.js'
import { JpegButtonLcdImagePacker } from '../services/imagePacker/jpeg.js'
import { Gen2InputService } from '../services/input/gen2.js'
import type { PropertiesService } from '../services/properties/interface.js'

export function createBaseGen2Properties(
	definition: StreamDeckModelDefinition,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	propertiesService: PropertiesService | null,
	transform?: JpegPackerTransformOptions,
): StreamDeckServicesDefinition {
	const fullProperties = definition.properties

	const events = new CallbackHook<StreamDeckEvents>()

	return {
		modelInfo: definition.info,
		deviceProperties: fullProperties,
		events,
		properties: propertiesService ?? new Gen2PropertiesService(device),
		buttonsLcd: new DefaultButtonsLcdService(
			new StreamdeckDefaultImageWriter(new StreamdeckGen2ImageHeaderGenerator()),
			new JpegButtonLcdImagePacker(options.encodeJPEG, transform ?? { xFlip: true, yFlip: true }),
			device,
			fullProperties,
		),
		lcdSegmentDisplay: null,
		inputService: new Gen2InputService(fullProperties, events),
		encoderLed: null,
	}
}
