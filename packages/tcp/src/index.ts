import type { JPEGEncodeOptions } from '@elgato-stream-deck/node-lib'

export {
	VENDOR_ID,
	DeviceModelId,
	DeviceModelType,
	KeyIndex,
	StreamDeck,
	StreamDeckProxy,
	LcdPosition,
	Dimension,
	StreamDeckControlDefinitionBase,
	StreamDeckButtonControlDefinition,
	StreamDeckButtonControlDefinitionNoFeedback,
	StreamDeckButtonControlDefinitionRgbFeedback,
	StreamDeckButtonControlDefinitionLcdFeedback,
	StreamDeckEncoderControlDefinition,
	StreamDeckLcdSegmentControlDefinition,
	StreamDeckControlDefinition,
	StreamDeckTcpChildDeviceInfo,
	OpenStreamDeckOptions,
	PreparedBuffer,
	StreamDeckModelInfo,
	StreamDeckModelFeatures,
	StreamDeckTransport,
	UsbMatch,
	DEVICE_MODEL_INFO,
	getModelInfo,
	findModelByUsb,
} from '@elgato-stream-deck/core'

export * from './types.js'
export * from './connectionManager.js'
export * from './discoveryService.js'
export { DEFAULT_TCP_PORT } from './constants.js'

export { JPEGEncodeOptions }
