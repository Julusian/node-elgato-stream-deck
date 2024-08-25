import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions, StreamDeckProperties } from './base.js'
import { StreamDeckBase } from './base.js'
import type { StreamdeckImageWriter } from '../services/imageWriter/types.js'
import type { FillImageTargetOptions } from '../util.js'
import { Gen1PropertiesService } from '../services/properties/gen1.js'
import { DefaultButtonsLcdService } from '../services/buttonsLcdDisplay/default.js'
import { BitmapButtonLcdImagePacker } from '../services/imagePacker/bitmap.js'

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

	return new StreamDeckBase(device, options, {
		deviceProperties: fullProperties,
		events: null,
		properties: new Gen1PropertiesService(device),
		buttonsLcd: new DefaultButtonsLcdService(
			imageWriter,
			new BitmapButtonLcdImagePacker(
				targetOptions,
				bmpImagePPM,
				properties.BUTTON_WIDTH_PX,
				properties.BUTTON_HEIGHT_PX,
			),
			device,
			fullProperties,
		),
		lcdStripDisplay: null,
		lcdStripInput: null,
		encoderInput: null,
	})
}
