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

	columnSpan: number

	widthPixels: number
	heightPixels: number
}

export type StreamDeckControlDefinition =
	| StreamDeckButtonControlDefinition
	| StreamDeckEncoderControlDefinition
	| StreamDeckLcdStripControlDefinition
