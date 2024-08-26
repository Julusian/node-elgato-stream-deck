import type { Dimension } from './id.js'

export interface StreamDeckControlDefinitionBase {
	type: 'button' | 'encoder' | 'lcd-strip'

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

export interface StreamDeckLcdStripControlDefinition extends StreamDeckControlDefinitionBase {
	type: 'lcd-strip'
	id: 0 // Future: Maybe there will be more than one LCD strip

	columnSpan: number

	pixelSize: Dimension

	/**
	 * Whether the LCD strip supports drawing regions
	 */
	drawRegions: boolean
}

export type StreamDeckControlDefinition =
	| StreamDeckButtonControlDefinition
	| StreamDeckEncoderControlDefinition
	| StreamDeckLcdStripControlDefinition
