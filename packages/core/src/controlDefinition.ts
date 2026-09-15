import type { Dimension } from './id.js'

export interface StreamDeckControlDefinitionBase {
	id: string | number
	type: 'button' | 'encoder' | 'lcd-segment'

	row: number
	column: number
}

export interface StreamDeckButtonControlDefinitionBase extends StreamDeckControlDefinitionBase {
	type: 'button'

	index: number
	/** @internal on wire HID index of this button */
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
	/** @internal on wire HID index of this button */
	hidIndex: number

	/** Whether the encoder has a central led */
	hasLed: boolean

	/** The number of steps in encoder led rings (if any) */
	ledRingSteps: number
	/** Encoding offset of the ring leds */
	ledRingOffset?: number
}

export interface StreamDeckLcdSegmentControlDefinition extends StreamDeckControlDefinitionBase {
	type: 'lcd-segment'
	index: 0 // Future: Maybe there will be more than one LCD segment

	id: 0 // Future: this will change to a string in the next major

	columnSpan: number
	rowSpan: number

	pixelSize: Dimension

	/**
	 * Whether the LCD segment supports drawing regions
	 */
	drawRegions: boolean
}

export type StreamDeckControlDefinition =
	StreamDeckButtonControlDefinition | StreamDeckEncoderControlDefinition | StreamDeckLcdSegmentControlDefinition
