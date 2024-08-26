import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions, StreamDeckProperties, StreamDeckServicesDefinition } from './base.js'
import { StreamdeckDefaultImageWriter } from '../services/imageWriter/imageWriter.js'
import { StreamdeckGen2ImageHeaderGenerator } from '../services/imageWriter/headerGenerator.js'
import { DefaultButtonsLcdService } from '../services/buttonsLcdDisplay/default.js'
import { CallbackHook } from '../services/callback-hook.js'
import type { StreamDeckEvents } from '../types.js'
import { Gen2PropertiesService } from '../services/properties/gen2.js'
import { JpegButtonLcdImagePacker } from '../services/imagePacker/jpeg.js'
import { Gen2InputService } from '../services/input/gen2.js'

function extendDevicePropertiesForGen2(rawProps: StreamDeckGen2Properties): StreamDeckProperties {
	return {
		...rawProps,
		KEY_DATA_OFFSET: 3,
		SUPPORTS_RGB_KEY_FILL: true,
	}
}

export type StreamDeckGen2Properties = Omit<StreamDeckProperties, 'KEY_DATA_OFFSET' | 'SUPPORTS_RGB_KEY_FILL'>

export function createBaseGen2Properties(
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	properties: StreamDeckGen2Properties,
	disableXYFlip?: boolean,
): StreamDeckServicesDefinition {
	const fullProperties = extendDevicePropertiesForGen2(properties)

	const events = new CallbackHook<StreamDeckEvents>()

	return {
		deviceProperties: fullProperties,
		events,
		properties: new Gen2PropertiesService(device),
		buttonsLcd: new DefaultButtonsLcdService(
			new StreamdeckDefaultImageWriter(new StreamdeckGen2ImageHeaderGenerator()),
			new JpegButtonLcdImagePacker(options.encodeJPEG, !disableXYFlip),
			device,
			fullProperties,
		),
		lcdSegmentDisplay: null,
		inputService: new Gen2InputService(fullProperties, events),
	}
}
