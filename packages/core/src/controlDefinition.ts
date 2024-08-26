import type { Dimension } from './id.js'

export interface StreamDeckControlDefinitionBase {
	type: 'button' | 'encoder' | 'lcd-segment'

	row: number
	column: number
}

export interface StreamDeckButtonControlDefinitionBase extends StreamDeckControlDefinitionBase {
	type: 'button'

	index: number
	hidIndex: number

	feedbackType: 'none' | 'rgb' | 'lcd'
}
export interface StreamDeckButtonControlDefinitionNoFeedback extends StreamDeckButtonControlDefinitionBase {
	feedbackType: 'none'
}
export interface StreamDeckButtonControlDefinitionRgbFeedback extends StreamDeckButtonControlDefinitionBase {
	feedbackType: 'rgb'
}

export interface StreamDeckButtonControlDefinitionLcdFeedback extends StreamDeckButtonControlDefinitionBase {
	feedbackType: 'lcd'

	pixelSize: Dimension
}

export type StreamDeckButtonControlDefinition =
	| StreamDeckButtonControlDefinitionNoFeedback
	| StreamDeckButtonControlDefinitionRgbFeedback
	| StreamDeckButtonControlDefinitionLcdFeedback

export interface StreamDeckEncoderControlDefinition extends StreamDeckControlDefinitionBase {
	type: 'encoder'

	index: number
	hidIndex: number
}

export interface StreamDeckLcdSegmentControlDefinition extends StreamDeckControlDefinitionBase {
	type: 'lcd-segment'
	id: 0 // Future: Maybe there will be more than one LCD segment

	columnSpan: number
	rowSpan: number

	pixelSize: Dimension

	/**
	 * Whether the LCD segment supports drawing regions
	 */
	drawRegions: boolean
}

export type StreamDeckControlDefinition =
	| StreamDeckButtonControlDefinition
	| StreamDeckEncoderControlDefinition
	| StreamDeckLcdSegmentControlDefinition
