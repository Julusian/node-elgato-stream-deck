import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import type { StreamDeckGen2Properties } from './generic-gen2.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import { DeviceModelId, MODEL_NAMES } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import type { StreamDeckControlDefinition, StreamDeckLcdSegmentControlDefinition } from '../controlDefinition.js'
import { StreamDeckPlusLcdService } from '../services/lcdSegmentDisplay/plus.js'

const plusXlControls: StreamDeckControlDefinition[] = generateButtonsGrid(9, 4, { width: 80, height: 80 })
plusXlControls.push(
	{
		type: 'lcd-segment',
		row: 4,
		column: 0,
		columnSpan: 9,
		rowSpan: 1,

		id: 0,

		pixelSize: Object.freeze({
			width: 1200,
			height: 100,
		}),

		drawRegions: true,
	},
	{
		type: 'encoder',
		row: 5,
		column: 0,
		index: 0,
		hidIndex: 0,

		hasLed: false,
		ledRingSteps: 0,
	},
	{
		type: 'encoder',
		row: 5,
		column: 2,
		index: 1,
		hidIndex: 1,

		hasLed: false,
		ledRingSteps: 0,
	},
	{
		type: 'encoder',
		row: 5,
		column: 3,
		index: 2,
		hidIndex: 2,

		hasLed: false,
		ledRingSteps: 0,
	},
	{
		type: 'encoder',
		row: 5,
		column: 5,
		index: 3,
		hidIndex: 3,

		hasLed: false,
		ledRingSteps: 0,
	},
	{
		type: 'encoder',
		row: 5,
		column: 6,
		index: 4,
		hidIndex: 4,

		hasLed: false,
		ledRingSteps: 0,
	},
	{
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
	MODEL: DeviceModelId.PLUS_XL,
	PRODUCT_NAME: MODEL_NAMES[DeviceModelId.PLUS_XL],
	SUPPORTS_RGB_KEY_FILL: true,

	CONTROLS: freezeDefinitions(plusXlControls),

	KEY_SPACING_HORIZONTAL: 99,
	KEY_SPACING_VERTICAL: 40,

	FULLSCREEN_PANELS: 0,
	HAS_NFC_READER: false,
	SUPPORTS_CHILD_DEVICES: false,
}
const lcdSegmentControls = plusXlProperties.CONTROLS.filter(
	(control): control is StreamDeckLcdSegmentControlDefinition => control.type === 'lcd-segment',
)

export function StreamDeckPlusXlFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckBase {
	const services = createBaseGen2Properties(device, options, plusXlProperties, null, {
		rotate: true,
		yFlip: true,
	})
	services.lcdSegmentDisplay = new StreamDeckPlusLcdService(options.encodeJPEG, device, lcdSegmentControls)

	return new StreamDeckBase(device, options, services)
}
