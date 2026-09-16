import type { StreamDeckControlDefinition } from '../controlDefinition.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import type { StreamDeckStaticProperties } from './base.js'
import type { StreamDeckGen1Properties } from './generic-gen1.js'
import type { StreamDeckGen2Properties } from './generic-gen2.js'

/**
 * The static properties of each model.
 *
 * Note: this module must not import anything which pulls in the services used to drive a device,
 * so that `DEVICE_MODEL_INFO` can be consumed without them.
 */

export const originalProperties: StreamDeckGen1Properties = {
	supportsRgbKeyFill: false,

	controls: freezeDefinitions(generateButtonsGrid(5, 3, { width: 72, height: 72 }, true)),

	keySpacingHorizontal: 25,
	keySpacingVertical: 25,

	fullscreenPanels: 0,
}

export const sixKeyProperties: StreamDeckGen1Properties = {
	supportsRgbKeyFill: false, // TODO - verify this

	controls: freezeDefinitions(generateButtonsGrid(3, 2, { width: 80, height: 80 })),

	keySpacingHorizontal: 28,
	keySpacingVertical: 28,

	fullscreenPanels: 0,
}

export const fifteenKeyProperties: StreamDeckGen2Properties = {
	supportsRgbKeyFill: true,

	controls: freezeDefinitions(generateButtonsGrid(5, 3, { width: 72, height: 72 })),

	keySpacingHorizontal: 25,
	keySpacingVertical: 25,

	fullscreenPanels: 1,
	hasNfcReader: false,
	supportsChildDevices: false,
}

export const thirtyTwoKeyProperties: StreamDeckGen2Properties = {
	supportsRgbKeyFill: true,

	controls: freezeDefinitions(generateButtonsGrid(8, 4, { width: 96, height: 96 })),

	keySpacingHorizontal: 32,
	keySpacingVertical: 39,

	fullscreenPanels: 1,
	hasNfcReader: false,
	supportsChildDevices: false,
}

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

export const plusProperties: StreamDeckGen2Properties = {
	supportsRgbKeyFill: true,

	controls: freezeDefinitions(plusControls),

	keySpacingHorizontal: 99,
	keySpacingVertical: 40,

	fullscreenPanels: 1,
	hasNfcReader: false,
	supportsChildDevices: false,
}

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

export const plusXlProperties: StreamDeckGen2Properties = {
	supportsRgbKeyFill: true,

	controls: freezeDefinitions(plusXlControls),

	keySpacingHorizontal: 99,
	keySpacingVertical: 40,

	fullscreenPanels: 1,
	hasNfcReader: false,
	supportsChildDevices: false,
}

const neoControls: StreamDeckControlDefinition[] = generateButtonsGrid(4, 2, { width: 96, height: 96 })
neoControls.push(
	{
		id: 'page-l',
		type: 'button',
		row: 2,
		column: 0,
		index: 8,
		hidIndex: 8,
		feedbackType: 'rgb',
	},
	{
		id: 0,
		type: 'lcd-segment',
		row: 2,
		column: 1,
		columnSpan: 2,
		rowSpan: 1,

		index: 0,

		pixelSize: {
			width: 248,
			height: 58,
		},

		drawRegions: false,
	},
	{
		id: 'page-r',
		type: 'button',
		row: 2,
		column: 3,
		index: 9,
		hidIndex: 9,
		feedbackType: 'rgb',
	},
)

export const neoProperties: StreamDeckGen2Properties = {
	controls: freezeDefinitions(neoControls),

	keySpacingHorizontal: 30,
	keySpacingVertical: 30,

	fullscreenPanels: 1,
	hasNfcReader: false,
	supportsChildDevices: false,
	supportsRgbKeyFill: true,
}

const pedalControls: StreamDeckControlDefinition[] = [
	{
		id: 'button-0',
		type: 'button',
		row: 0,
		column: 0,
		index: 0,
		hidIndex: 0,
		feedbackType: 'none',
	},
	{
		id: 'button-1',
		type: 'button',
		row: 0,
		column: 1,
		index: 1,
		hidIndex: 1,
		feedbackType: 'none',
	},
	{
		id: 'button-2',
		type: 'button',
		row: 0,
		column: 2,
		index: 2,
		hidIndex: 2,
		feedbackType: 'none',
	},
]

export const pedalProperties: StreamDeckStaticProperties = {
	keyDataOffset: 3,
	supportsRgbKeyFill: false,

	controls: freezeDefinitions(pedalControls),

	keySpacingHorizontal: 0,
	keySpacingVertical: 0,

	fullscreenPanels: 0,
	hasNfcReader: false,
	supportsChildDevices: false,
}

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
	supportsRgbKeyFill: true,

	controls: freezeDefinitions(studioControls),

	keySpacingHorizontal: 0, // TODO
	keySpacingVertical: 0, // TODO

	fullscreenPanels: 2,

	hasNfcReader: true,
	supportsChildDevices: true,
}

export const networkDockProperties: StreamDeckStaticProperties = {
	keyDataOffset: 0,

	supportsRgbKeyFill: false,

	controls: freezeDefinitions([]),

	keySpacingHorizontal: 0,
	keySpacingVertical: 0,

	fullscreenPanels: 0,
	hasNfcReader: false,
	supportsChildDevices: true,
}

const k100Controls: StreamDeckControlDefinition[] = generateButtonsGrid(3, 4, { width: 160, height: 160 }, false, 0, 2)
k100Controls.push(
	{
		id: `encoder-0`,
		type: 'encoder',
		row: 0,
		column: 0,
		index: 0,
		hidIndex: 0,

		hasLed: false,
		ledRingSteps: 4,
		ledRingOffset: 3,
	},
	{
		id: `encoder-1`,
		type: 'encoder',
		row: 0,
		column: 2,
		index: 1,
		hidIndex: 1,

		hasLed: false,
		ledRingSteps: 4,
		ledRingOffset: 1,
	},
	{
		id: 0,
		type: 'lcd-segment',
		row: 1,
		column: 0,
		columnSpan: 3,
		rowSpan: 1,

		index: 0,

		pixelSize: Object.freeze({
			width: 720,
			height: 384,
		}),

		drawRegions: true,
	},
)

export const galleonK100Properties: StreamDeckGen2Properties = {
	supportsRgbKeyFill: true,

	controls: freezeDefinitions(k100Controls),

	keySpacingHorizontal: 64,
	keySpacingVertical: 64,

	fullscreenPanels: 0,
	hasNfcReader: false,
	supportsChildDevices: false,
}
