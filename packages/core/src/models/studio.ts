import type { HIDDevice } from '../hid-device.js'
import { StreamDeckBase, type OpenStreamDeckOptions } from './base.js'
import { createBaseGen2Properties, type StreamDeckGen2Properties } from './generic-gen2.js'
import { DeviceModelId, MODEL_NAMES } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import type { StreamDeckControlDefinition } from '../controlDefinition.js'
import type { PropertiesService } from '../services/properties/interface.js'
import { StudioPropertiesService } from '../services/properties/studio.js'
import { StudioEncoderLedService } from '../services/encoderLed/studio.js'

const studioControls: StreamDeckControlDefinition[] = [
	{
		id: 'encoder-l',
		type: 'encoder',
		row: 0,
		column: 0,
		index: 0,
		hidIndex: 0,

		hasLed: true,
		ledRingSteps: 24,
	},
	...generateButtonsGrid(16, 2, { width: 144, height: 112 }, false, 1),
	{
		id: 'encoder-r',
		type: 'encoder',
		row: 0,
		column: 17,
		index: 1,
		hidIndex: 1,

		hasLed: true,
		ledRingSteps: 24,
		ledRingOffset: 12,
	},
]

export const studioProperties: StreamDeckGen2Properties = {
	model: DeviceModelId.STUDIO,
	productName: MODEL_NAMES[DeviceModelId.STUDIO],
	supportsRgbKeyFill: true,

	controls: freezeDefinitions(studioControls),

	keySpacingHorizontal: 0, // TODO
	keySpacingVertical: 0, // TODO

	fullscreenPanels: 2,

	hasNfcReader: true,
	supportsChildDevices: true,
}

export function StreamDeckStudioFactory(
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	propertiesService?: PropertiesService,
): StreamDeckBase {
	const services = createBaseGen2Properties(
		device,
		options,
		studioProperties,
		propertiesService ?? new StudioPropertiesService(device),
		{ xFlip: false, yFlip: false },
	)
	services.encoderLed = new StudioEncoderLedService(device, studioControls)

	return new StreamDeckBase(device, options, services)
}
