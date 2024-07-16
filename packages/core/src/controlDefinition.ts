import { Dimension } from '.'

export interface StreamDeckControlDefinitionBase {
	type: 'button' | 'encoder' | 'lcd-strip'

	row: number
	column: number
}

export interface StreamDeckButtonControlDefinition extends StreamDeckControlDefinitionBase {
	type: 'button'

	index: number
	hidIndex: number

	feedbackType: 'none' | 'rgb' | 'lcd'
}

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
}

export type StreamDeckControlDefinition =
	| StreamDeckButtonControlDefinition
	| StreamDeckEncoderControlDefinition
	| StreamDeckLcdStripControlDefinition
