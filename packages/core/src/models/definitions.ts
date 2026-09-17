import type { StreamDeckControlDefinition } from '../controlDefinition.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import type { StreamDeckStaticProperties } from './base.js'

/**
 * The static properties of each model.
 *
 * Note: this module must not import anything which pulls in the services used to drive a device,
 * so that `DEVICE_MODEL_INFO` can be consumed without them.
 *
 * The `faceSize` and `bounds` are in panel pixels, transcribed from the dimensioned drawings at
 * https://docs.elgato.com/streamdeck/hid/. Anything those do not cover is marked as an estimate.
 */

/** Stream Deck Classic, whose panel is 480x272 */
const classicFaceSize = { width: 480, height: 272 }
const classicGridBounds = {
	left: 11,
	top: 5,
	columnGaps: 25,
	rowGaps: 25,
}

export const originalProperties: StreamDeckStaticProperties = {
	keyDataOffset: 0,
	hasNfcReader: false,
	supportsChildDevices: false,
	supportsRgbKeyFill: false,

	controls: freezeDefinitions(
		generateButtonsGrid(5, 3, { width: 72, height: 72 }, { rtl: true, bounds: classicGridBounds }),
	),

	faceSize: classicFaceSize,

	fullscreenPanels: 0,
}

export const sixKeyProperties: StreamDeckStaticProperties = {
	keyDataOffset: 0,
	hasNfcReader: false,
	supportsChildDevices: false,
	supportsRgbKeyFill: false, // TODO - verify this

	// Stream Deck Mini, whose panel is 320x240
	controls: freezeDefinitions(
		generateButtonsGrid(
			3,
			2,
			{ width: 80, height: 80 },
			{
				bounds: {
					left: 14,
					top: 26,
					// The two column gaps really are different widths
					columnGaps: [28, 27],
					rowGaps: 28,
				},
			},
		),
	),

	faceSize: { width: 320, height: 240 },

	fullscreenPanels: 0,
}

export const fifteenKeyProperties: StreamDeckStaticProperties = {
	keyDataOffset: 3,
	supportsRgbKeyFill: true,

	controls: freezeDefinitions(generateButtonsGrid(5, 3, { width: 72, height: 72 }, { bounds: classicGridBounds })),

	faceSize: classicFaceSize,

	fullscreenPanels: 1,
	hasNfcReader: false,
	supportsChildDevices: false,
}

export const thirtyTwoKeyProperties: StreamDeckStaticProperties = {
	keyDataOffset: 3,
	supportsRgbKeyFill: true,

	// Stream Deck XL, whose panel is 1024x600
	controls: freezeDefinitions(
		generateButtonsGrid(
			8,
			4,
			{ width: 96, height: 96 },
			{
				bounds: {
					left: 14,
					top: 47,
					// Every gap is labelled 32, which leaves the chain 2px short. Measuring the
					// drawing confirms the margins, so the gaps are really 32.29 apart
					columnGaps: [32, 32, 33, 32, 32, 33, 32],
					rowGaps: 39,
				},
			},
		),
	),

	faceSize: { width: 1024, height: 600 },

	fullscreenPanels: 1,
	hasNfcReader: false,
	supportsChildDevices: false,
}

/**
 * Stream Deck +, whose panel is 800x480. The encoders sit below the panel, making the face taller.
 * Their geometry is not published, so it is estimated: as wide as the button column each sits under,
 * and as far below the panel as the buttons are above the touch strip.
 */
const plusEncoderSize = 120
const plusEncoderY = 480 + 88
const plusControls: StreamDeckControlDefinition[] = generateButtonsGrid(
	4,
	2,
	{ width: 120, height: 120 },
	{
		bounds: {
			left: 13,
			top: 12,
			columnGaps: 99,
			rowGaps: 40,
		},
	},
)
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

		bounds: { x: 0, y: 380, width: 800, height: 100 },

		drawRegions: true,
	},
	...[0, 1, 2, 3].map((index): StreamDeckControlDefinition => {
		const buttonAbove = plusControls.find((control) => control.id === `button-${index}`)
		if (!buttonAbove?.bounds) throw new Error(`Missing bounds for button-${index}`)

		return {
			id: `encoder-${index}`,
			type: 'encoder',
			row: 3,
			column: index,
			index,
			hidIndex: index,

			bounds: { x: buttonAbove.bounds.x, y: plusEncoderY, width: plusEncoderSize, height: plusEncoderSize },

			hasLed: false,
			ledRingSteps: 0,
		}
	}),
)

export const plusProperties: StreamDeckStaticProperties = {
	keyDataOffset: 3,
	supportsRgbKeyFill: true,

	controls: freezeDefinitions(plusControls),

	faceSize: { width: 800, height: plusEncoderY + plusEncoderSize },

	fullscreenPanels: 1,
	hasNfcReader: false,
	supportsChildDevices: false,
}

/**
 * Stream Deck + XL, whose panel is 1280x800. As on the Stream Deck +, the encoders sit below the
 * panel and their geometry is estimated. There are 6 of them across 9 columns, so they cannot line
 * up with the columns; they are spread evenly, and their `column` is that spacing rounded.
 */
const plusXlEncoderSize = 112
const plusXlEncoderY = 800 + 100
const plusXlControls: StreamDeckControlDefinition[] = generateButtonsGrid(
	9,
	4,
	{ width: 112, height: 112 },
	{
		bounds: {
			left: 11,
			top: 32,
			columnGaps: [31, 32, 31, 32, 31, 32, 31, 32],
			rowGaps: [32, 30, 32],
		},
	},
)
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

		bounds: { x: 40, y: 674, width: 1200, height: 100 },

		drawRegions: true,
	},
	...[0, 2, 3, 5, 6, 8].map((column, index): StreamDeckControlDefinition => {
		const gridLeft = 11
		const gridWidth = 9 * 112 + 31 * 4 + 32 * 4
		const centre = gridLeft + ((index + 0.5) * gridWidth) / 6

		return {
			id: `encoder-${index}`,
			type: 'encoder',
			row: 5,
			column,
			index,
			hidIndex: index,

			bounds: {
				x: centre - plusXlEncoderSize / 2,
				y: plusXlEncoderY,
				width: plusXlEncoderSize,
				height: plusXlEncoderSize,
			},

			hasLed: false,
			ledRingSteps: 0,
		}
	}),
)

export const plusXlProperties: StreamDeckStaticProperties = {
	keyDataOffset: 3,
	supportsRgbKeyFill: true,

	controls: freezeDefinitions(plusXlControls),

	faceSize: { width: 1280, height: plusXlEncoderY + plusXlEncoderSize },

	fullscreenPanels: 1,
	hasNfcReader: false,
	supportsChildDevices: false,
}

/** Stream Deck Neo, whose panel is 480x320 */
const neoControls: StreamDeckControlDefinition[] = generateButtonsGrid(
	4,
	2,
	{ width: 96, height: 96 },
	{
		bounds: {
			left: 3,
			top: 9,
			columnGaps: 30,
			rowGaps: 30,
		},
	},
)
neoControls.push(
	{
		id: 'page-l',
		type: 'button',
		row: 2,
		column: 0,
		index: 8,
		hidIndex: 8,
		feedbackType: 'rgb',

		// A touch strip under the leftmost column of buttons, not a key
		bounds: { x: 3, y: 283, width: 96, height: 16 },
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

		// Flush with the bottom of the panel
		bounds: { x: 116, y: 262, width: 248, height: 58 },

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

		bounds: { x: 381, y: 283, width: 96, height: 16 },
	},
)

export const neoProperties: StreamDeckStaticProperties = {
	keyDataOffset: 3,
	controls: freezeDefinitions(neoControls),

	faceSize: { width: 480, height: 320 },

	fullscreenPanels: 1,
	hasNfcReader: false,
	supportsChildDevices: false,
	supportsRgbKeyFill: true,
}

/**
 * Stream Deck Pedal. It has no panel, and no drawing is published, so the whole layout is ESTIMATED
 * from the proportions of the product: three pedals side by side, the middle one the widest.
 */
const pedalControls: StreamDeckControlDefinition[] = [
	{
		id: 'button-0',
		type: 'button',
		row: 0,
		column: 0,
		index: 0,
		hidIndex: 0,
		feedbackType: 'none',

		bounds: { x: 20, y: 20, width: 130, height: 354 },
	},
	{
		id: 'button-1',
		type: 'button',
		row: 0,
		column: 1,
		index: 1,
		hidIndex: 1,
		feedbackType: 'none',

		bounds: { x: 160, y: 20, width: 180, height: 354 },
	},
	{
		id: 'button-2',
		type: 'button',
		row: 0,
		column: 2,
		index: 2,
		hidIndex: 2,
		feedbackType: 'none',

		bounds: { x: 350, y: 20, width: 130, height: 354 },
	},
]

export const pedalProperties: StreamDeckStaticProperties = {
	keyDataOffset: 3,
	supportsRgbKeyFill: false,

	controls: freezeDefinitions(pedalControls),

	faceSize: { width: 500, height: 394 },

	fullscreenPanels: 0,
	hasNfcReader: false,
	supportsChildDevices: false,
}

/**
 * Stream Deck Studio, a 1U rack unit. No drawing is published, so its layout is ESTIMATED: the
 * buttons tiled between an encoder at each end, scaled so the face is the 10.9:1 of a 19" 1U panel.
 */
const studioEncoderSize = 112
const studioFaceSize = { width: 2928, height: 270 }
const studioControls: StreamDeckControlDefinition[] = [
	{
		id: 'encoder-l',
		type: 'encoder',
		row: 0,
		column: 0,
		index: 0,
		hidIndex: 0,

		bounds: { x: 40, y: 79, width: studioEncoderSize, height: studioEncoderSize },

		hasLed: true,
		ledRingSteps: 24,
	},
	...generateButtonsGrid(
		16,
		2,
		{ width: 144, height: 112 },
		{
			columnOffset: 1,
			bounds: {
				left: 192,
				top: 15,
				columnGaps: 16,
				rowGaps: 16,
			},
		},
	),
	{
		id: 'encoder-r',
		type: 'encoder',
		row: 0,
		column: 17,
		index: 1,
		hidIndex: 1,

		bounds: {
			x: studioFaceSize.width - 40 - studioEncoderSize,
			y: 79,
			width: studioEncoderSize,
			height: studioEncoderSize,
		},

		hasLed: true,
		ledRingSteps: 24,
		ledRingOffset: 12,
	},
]

export const studioProperties: StreamDeckStaticProperties = {
	keyDataOffset: 3,
	supportsRgbKeyFill: true,

	controls: freezeDefinitions(studioControls),

	faceSize: studioFaceSize,

	fullscreenPanels: 2,

	hasNfcReader: true,
	supportsChildDevices: true,
}

export const networkDockProperties: StreamDeckStaticProperties = {
	keyDataOffset: 0,

	supportsRgbKeyFill: false,

	controls: freezeDefinitions([]),

	// It has no controls, so this is just the footprint of the case in mm
	faceSize: { width: 79, height: 59 },

	fullscreenPanels: 0,
	hasNfcReader: false,
	supportsChildDevices: true,
}

/**
 * Corsair Galleon K100, whose panel is 720x1280 and portrait, with the screen filling the top of it.
 * The encoders sit above the panel and their geometry is estimated: as wide as the button column
 * each sits over, and as far above the panel as the screen is above the buttons.
 */
const k100ScreenGap = 59
const k100EncoderSize = 160
/** The encoders sit above the panel, so it does not start at the top of the face */
const k100PanelTop = k100EncoderSize + k100ScreenGap

const k100Controls: StreamDeckControlDefinition[] = generateButtonsGrid(
	3,
	4,
	{ width: 160, height: 160 },
	{
		rowOffset: 2,
		bounds: {
			left: 56,
			top: k100PanelTop + 384 + k100ScreenGap,
			columnGaps: 64,
			rowGaps: 64,
		},
	},
)
k100Controls.push(
	...[0, 1].map((index): StreamDeckControlDefinition => {
		const buttonBelow = k100Controls.find((control) => control.id === `button-${index * 2}`)
		if (!buttonBelow?.bounds) throw new Error(`Missing bounds for button-${index * 2}`)

		return {
			id: `encoder-${index}`,
			type: 'encoder',
			row: 0,
			column: index * 2,
			index,
			hidIndex: index,

			bounds: { x: buttonBelow.bounds.x, y: 0, width: k100EncoderSize, height: k100EncoderSize },

			hasLed: false,
			ledRingSteps: 4,
			ledRingOffset: index === 0 ? 3 : 1,
		}
	}),
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

		bounds: { x: 0, y: k100PanelTop, width: 720, height: 384 },

		drawRegions: true,
	},
)

export const galleonK100Properties: StreamDeckStaticProperties = {
	keyDataOffset: 3,
	supportsRgbKeyFill: true,

	controls: freezeDefinitions(k100Controls),

	faceSize: { width: 720, height: k100PanelTop + 1280 },

	fullscreenPanels: 0,
	hasNfcReader: false,
	supportsChildDevices: false,
}
