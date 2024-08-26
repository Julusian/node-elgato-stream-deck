import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import type { StreamDeckGen2Properties } from './generic-gen2.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import { DeviceModelId, MODEL_NAMES } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import type { StreamDeckControlDefinition, StreamDeckLcdSegmentControlDefinition } from '../controlDefinition.js'
import { StreamDeckPlusLcdService } from '../services/lcdSegmentDisplay/plus.js'

const plusControls: StreamDeckControlDefinition[] = generateButtonsGrid(4, 2, { width: 120, height: 120 })
plusControls.push(
	{
		type: 'lcd-segment',
		row: 2,
		column: 0,
		columnSpan: 4,
		rowSpan: 1,

		id: 0,

		pixelSize: Object.freeze({
			width: 800,
			height: 100,
		}),

		drawRegions: true,
	},
	{
		type: 'encoder',
		row: 3,
		column: 0,
		index: 0,
		hidIndex: 0,

		hasLed: false,
		ledRingSteps: 0,
	},
	{
		type: 'encoder',
		row: 3,
		column: 1,
		index: 1,
		hidIndex: 1,

		hasLed: false,
		ledRingSteps: 0,
	},
	{
		type: 'encoder',
		row: 3,
		column: 2,
		index: 2,
		hidIndex: 2,

		hasLed: false,
		ledRingSteps: 0,
	},
	{
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
	MODEL: DeviceModelId.PLUS,
	PRODUCT_NAME: MODEL_NAMES[DeviceModelId.PLUS],

	CONTROLS: freezeDefinitions(plusControls),

	KEY_SPACING_HORIZONTAL: 99,
	KEY_SPACING_VERTICAL: 40,

	FULLSCREEN_PANELS: 0,
	HAS_NFC_READER: false,
	SUPPORTS_CHILD_DEVICES: false,
}
const lcdSegmentControls = plusProperties.CONTROLS.filter(
	(control): control is StreamDeckLcdSegmentControlDefinition => control.type === 'lcd-segment',
)

export function StreamDeckPlusFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckBase {
	const services = createBaseGen2Properties(device, options, plusProperties, null, null, true)
	services.lcdSegmentDisplay = new StreamDeckPlusLcdService(options.encodeJPEG, device, lcdSegmentControls)

	return new StreamDeckBase(device, options, services)
}
