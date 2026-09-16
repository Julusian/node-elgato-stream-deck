import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import type { StreamDeckGen2Properties } from './generic-gen2.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import { DeviceModelId, MODEL_NAMES } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import type { StreamDeckControlDefinition, StreamDeckLcdSegmentControlDefinition } from '../controlDefinition.js'
import { StreamdeckDefaultLcdService } from '../services/lcdSegmentDisplay/generic.js'

const plusControls: StreamDeckControlDefinition[] = generateButtonsGrid(4, 2, { width: 120, height: 120 })
plusControls.push(
	{
		id: 0,
		type: 'lcd-segment',
		row: 2,
		column: 0,
		columnSpan: 4,
		rowSpan: 1,

		index: 0,

		pixelSize: Object.freeze({
			width: 800,
			height: 100,
		}),

		drawRegions: true,
	},
	{
		id: 'encoder-0',
		type: 'encoder',
		row: 3,
		column: 0,
		index: 0,
		hidIndex: 0,

		hasLed: false,
		ledRingSteps: 0,
	},
	{
		id: 'encoder-1',
		type: 'encoder',
		row: 3,
		column: 1,
		index: 1,
		hidIndex: 1,

		hasLed: false,
		ledRingSteps: 0,
	},
	{
		id: 'encoder-2',
		type: 'encoder',
		row: 3,
		column: 2,
		index: 2,
		hidIndex: 2,

		hasLed: false,
		ledRingSteps: 0,
	},
	{
		id: 'encoder-3',
		type: 'encoder',
		row: 3,
		column: 3,
		index: 3,
		hidIndex: 3,

		hasLed: false,
		ledRingSteps: 0,
	},
)

const plusProperties: StreamDeckGen2Properties = {
	model: DeviceModelId.PLUS,
	productName: MODEL_NAMES[DeviceModelId.PLUS],
	supportsRgbKeyFill: true,

	controls: freezeDefinitions(plusControls),

	keySpacingHorizontal: 99,
	keySpacingVertical: 40,

	fullscreenPanels: 1,
	hasNfcReader: false,
	supportsChildDevices: false,
}
const lcdSegmentControls = plusProperties.controls.filter(
	(control): control is StreamDeckLcdSegmentControlDefinition => control.type === 'lcd-segment',
)

export function StreamDeckPlusFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckBase {
	const services = createBaseGen2Properties(device, options, plusProperties, null, { xFlip: false, yFlip: false })
	services.lcdSegmentDisplay = new StreamdeckDefaultLcdService(
		options.encodeJPEG,
		device,
		lcdSegmentControls,
		false,
		DeviceModelId.PLUS,
	)

	return new StreamDeckBase(device, options, services)
}
