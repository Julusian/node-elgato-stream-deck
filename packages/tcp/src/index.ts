import { JPEGEncodeOptions } from '@elgato-stream-deck/node-lib/dist/jpeg'

export {
	VENDOR_ID,
	DeviceModelId,
	KeyIndex,
	StreamDeck,
	LcdPosition,
	Dimension,
	StreamDeckControlDefinitionBase,
	StreamDeckButtonControlDefinition,
	StreamDeckEncoderControlDefinition,
	StreamDeckLcdSegmentControlDefinition,
	StreamDeckControlDefinition,
	OpenStreamDeckOptions,
} from '@elgato-stream-deck/core'

export * from './types.js'
export * from './connectionManager.js'
export * from './discoveryService.js'

export { JPEGEncodeOptions }
