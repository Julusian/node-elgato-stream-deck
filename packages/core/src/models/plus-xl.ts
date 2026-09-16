import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import type { StreamDeckGen2Properties } from './generic-gen2.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import { DeviceModelId, MODEL_NAMES } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import type { StreamDeckControlDefinition, StreamDeckLcdSegmentControlDefinition } from '../controlDefinition.js'
import { StreamdeckDefaultLcdService } from '../services/lcdSegmentDisplay/generic.js'

const plusXlControls: StreamDeckControlDefinition[] = generateButtonsGrid(9, 4, { width: 112, height: 112 })
plusXlControls.push(
	{
		id: 0,
		type: 'lcd-segment',
		row: 4,
		column: 0,
		columnSpan: 9,
		rowSpan: 1,

		index: 0,

		pixelSize: Object.freeze({
			width: 1200,
			height: 100,
		}),

		drawRegions: true,
	},
	{
		id: 'encoder-0',
		type: 'encoder',
		row: 5,
		column: 0,
		index: 0,
		hidIndex: 0,

		hasLed: false,
		ledRingSteps: 0,
	},
	{
		id: 'encoder-1',
		type: 'encoder',
		row: 5,
		column: 2,
		index: 1,
		hidIndex: 1,

		hasLed: false,
		ledRingSteps: 0,
	},
	{
		id: 'encoder-2',
		type: 'encoder',
		row: 5,
		column: 3,
		index: 2,
		hidIndex: 2,

		hasLed: false,
		ledRingSteps: 0,
	},
	{
		id: 'encoder-3',
		type: 'encoder',
		row: 5,
		column: 5,
		index: 3,
		hidIndex: 3,

		hasLed: false,
		ledRingSteps: 0,
	},
	{
		id: 'encoder-4',
		type: 'encoder',
		row: 5,
		column: 6,
		index: 4,
		hidIndex: 4,

		hasLed: false,
		ledRingSteps: 0,
	},
	{
		id: 'encoder-5',
		type: 'encoder',
		row: 5,
		column: 8,
		index: 5,
		hidIndex: 5,

		hasLed: false,
		ledRingSteps: 0,
	},
)

const plusXlProperties: StreamDeckGen2Properties = {
	model: DeviceModelId.PLUS_XL,
	productName: MODEL_NAMES[DeviceModelId.PLUS_XL],
	supportsRgbKeyFill: true,

	controls: freezeDefinitions(plusXlControls),

	keySpacingHorizontal: 99,
	keySpacingVertical: 40,

	fullscreenPanels: 1,
	hasNfcReader: false,
	supportsChildDevices: false,
}
const lcdSegmentControls = plusXlProperties.controls.filter(
	(control): control is StreamDeckLcdSegmentControlDefinition => control.type === 'lcd-segment',
)

export function StreamDeckPlusXlFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckBase {
	const services = createBaseGen2Properties(device, options, plusXlProperties, null, {
		rotate: true,
		yFlip: true,
	})
	services.lcdSegmentDisplay = new StreamdeckDefaultLcdService(
		options.encodeJPEG,
		device,
		lcdSegmentControls,
		true,
		DeviceModelId.PLUS_XL,
	)

	return new StreamDeckBase(device, options, services)
}
