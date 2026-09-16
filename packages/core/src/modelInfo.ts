import type { StreamDeckControlDefinition } from './controlDefinition.js'
import { DeviceModelId } from './id.js'
import type { StreamDeckProperties, StreamDeckStaticProperties } from './models/base.js'
import {
	fifteenKeyProperties,
	sixKeyProperties,
	thirtyTwoKeyProperties,
	galleonK100Properties,
	networkDockProperties,
	neoProperties,
	originalProperties,
	pedalProperties,
	plusProperties,
	plusXlProperties,
	studioProperties,
} from './models/definitions.js'

/** Elgato vendor id */
export const VENDOR_ID = 0x0fd9
/** Corsair vendor id */
export const CORSAIR_VENDOR_ID = 0x1b1c

export enum DeviceModelType {
	STREAMDECK = 'streamdeck',
	PEDAL = 'pedal',
	NETWORK_DOCK = 'network-dock',
}

const MANUFACTURER_ELGATO = 'Elgato'
const MANUFACTURER_CORSAIR = 'Corsair'

/** A transport which a device can be connected over */
export type StreamDeckTransport = 'usb' | 'tcp'

/** The properties of a usb device which identify it as a model */
export interface UsbMatch {
	vendorId: number
	productId: number
	/**
	 * If needing to filter by usage
	 */
	hidUsage?: number
	/**
	 * If needing to filter by interface number
	 */
	hidInterface?: number
}

/** The optional capabilities of a model */
export interface StreamDeckModelFeatures {
	/** Whether the device has an nfc reader */
	nfcReader: boolean
	/** Whether the device can have child devices attached */
	childDevices: boolean
}

/**
 * Static information about a model of Stream Deck.
 * This holds no functions, so can be consumed without pulling in the code needed to drive a device.
 */
export interface StreamDeckModelInfo {
	id: DeviceModelId
	name: string
	manufacturer: string
	category: DeviceModelType

	/** The usb devices which identify as this model. Empty for models which are not connected over usb */
	usb: readonly UsbMatch[]
	/** The transports this model can be connected over */
	transports: readonly StreamDeckTransport[]

	controls: Readonly<StreamDeckControlDefinition[]>
	features: StreamDeckModelFeatures
}

/**
 * A model's public info, paired with the properties needed to drive it.
 *
 * The two are built together from a single source, so they cannot describe
 * different models. The properties are internal and are never exported from
 * the package index.
 * @internal
 */
export interface StreamDeckModelDefinition {
	readonly info: StreamDeckModelInfo
	readonly properties: StreamDeckProperties
}

interface ModelInfoOptions {
	/** Defaults to `DeviceModelType.STREAMDECK` */
	category?: DeviceModelType
	/** Defaults to Elgato */
	manufacturer?: string
	usb: UsbMatch[]
	/** Whether the device can be connected to directly over tcp */
	nativeTcp?: boolean
}

function createModelDefinition(
	id: DeviceModelId,
	name: string,
	properties: StreamDeckStaticProperties,
	options: ModelInfoOptions,
): StreamDeckModelDefinition {
	const transports: StreamDeckTransport[] = []
	if (options.usb.length > 0) transports.push('usb')
	if (options.nativeTcp) transports.push('tcp')

	const info: StreamDeckModelInfo = Object.freeze({
		id,
		name,
		manufacturer: options.manufacturer ?? MANUFACTURER_ELGATO,
		category: options.category ?? DeviceModelType.STREAMDECK,

		usb: Object.freeze(options.usb.map((match) => Object.freeze(match))),
		transports: Object.freeze(transports),

		controls: properties.controls,
		features: Object.freeze({
			nfcReader: properties.hasNfcReader,
			childDevices: properties.supportsChildDevices,
		}),
	})

	return Object.freeze({
		info,
		properties: Object.freeze({ ...properties, model: id, productName: name }),
	})
}

/**
 * Every known model, as its public info paired with the properties to drive it.
 * @internal
 */
export const DEVICE_MODEL_DEFINITIONS: Readonly<{ [id in DeviceModelId]: StreamDeckModelDefinition }> = Object.freeze({
	[DeviceModelId.ORIGINAL]: createModelDefinition(DeviceModelId.ORIGINAL, 'Stream Deck', originalProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x0060 }],
	}),
	[DeviceModelId.MINI]: createModelDefinition(DeviceModelId.MINI, 'Stream Deck Mini', sixKeyProperties, {
		usb: [
			{ vendorId: VENDOR_ID, productId: 0x0063 },
			{ vendorId: VENDOR_ID, productId: 0x0090 },
			{ vendorId: VENDOR_ID, productId: 0x00b3 },
		],
	}),
	[DeviceModelId.XL]: createModelDefinition(DeviceModelId.XL, 'Stream Deck XL', thirtyTwoKeyProperties, {
		usb: [
			{ vendorId: VENDOR_ID, productId: 0x006c },
			{ vendorId: VENDOR_ID, productId: 0x008f },
		],
	}),
	[DeviceModelId.ORIGINALV2]: createModelDefinition(DeviceModelId.ORIGINALV2, 'Stream Deck', fifteenKeyProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x006d }],
	}),
	[DeviceModelId.ORIGINALMK2]: createModelDefinition(
		DeviceModelId.ORIGINALMK2,
		'Stream Deck MK.2',
		fifteenKeyProperties,
		{
			usb: [{ vendorId: VENDOR_ID, productId: 0x0080 }],
		},
	),
	[DeviceModelId.ORIGINALMK2SCISSOR]: createModelDefinition(
		DeviceModelId.ORIGINALMK2SCISSOR,
		'Stream Deck MK.2 (Scissor)',
		fifteenKeyProperties,
		{
			usb: [{ vendorId: VENDOR_ID, productId: 0x00a5 }],
		},
	),
	[DeviceModelId.PLUS]: createModelDefinition(DeviceModelId.PLUS, 'Stream Deck +', plusProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x0084 }],
	}),
	[DeviceModelId.PEDAL]: createModelDefinition(DeviceModelId.PEDAL, 'Stream Deck Pedal', pedalProperties, {
		category: DeviceModelType.PEDAL,
		usb: [{ vendorId: VENDOR_ID, productId: 0x0086 }],
	}),
	[DeviceModelId.NEO]: createModelDefinition(DeviceModelId.NEO, 'Stream Deck Neo', neoProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x009a }],
	}),
	[DeviceModelId.STUDIO]: createModelDefinition(DeviceModelId.STUDIO, 'Stream Deck Studio', studioProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x00aa }],
		nativeTcp: true,
	}),
	[DeviceModelId.MODULE6]: createModelDefinition(DeviceModelId.MODULE6, 'Stream Deck 6 Module', sixKeyProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x00b8 }],
	}),
	[DeviceModelId.MODULE15]: createModelDefinition(
		DeviceModelId.MODULE15,
		'Stream Deck 15 Module',
		fifteenKeyProperties,
		{
			usb: [{ vendorId: VENDOR_ID, productId: 0x00b9 }],
		},
	),
	[DeviceModelId.MODULE32]: createModelDefinition(
		DeviceModelId.MODULE32,
		'Stream Deck 32 Module',
		thirtyTwoKeyProperties,
		{
			usb: [{ vendorId: VENDOR_ID, productId: 0x00ba }],
		},
	),
	[DeviceModelId.NETWORK_DOCK]: createModelDefinition(
		DeviceModelId.NETWORK_DOCK,
		'Stream Deck Network Dock',
		networkDockProperties,
		{
			category: DeviceModelType.NETWORK_DOCK,
			usb: [], // This is not a usb device
			nativeTcp: true,
		},
	),
	[DeviceModelId.GALLEON_K100]: createModelDefinition(
		DeviceModelId.GALLEON_K100,
		'Galleon K100 SD',
		galleonK100Properties,
		{
			manufacturer: MANUFACTURER_CORSAIR,
			usb: [{ vendorId: CORSAIR_VENDOR_ID, productId: 0x2b18, hidUsage: 0x01, hidInterface: 0 }],
		},
	),
	[DeviceModelId.PLUS_XL]: createModelDefinition(DeviceModelId.PLUS_XL, 'Stream Deck + XL', plusXlProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x00c6 }],
	}),
})

/**
 * Static information about every known model.
 * @experimental Will become DEVICE_MODELS in v8
 */
export const DEVICE_MODEL_INFO: Readonly<{ [id in DeviceModelId]: StreamDeckModelInfo }> = Object.freeze(
	Object.fromEntries(
		Object.values(DEVICE_MODEL_DEFINITIONS).map((definition) => [definition.info.id, definition.info]),
	),
) as Readonly<{ [id in DeviceModelId]: StreamDeckModelInfo }>

const ALL_MODEL_INFO: readonly StreamDeckModelInfo[] = Object.freeze(Object.values(DEVICE_MODEL_INFO))

/**
 * Get the information about a model, if it is known
 */
export function getModelInfo(id: DeviceModelId): StreamDeckModelInfo | undefined {
	return DEVICE_MODEL_INFO[id]
}

/**
 * Find the model which a usb device identifies as, if any.
 * The `usage` and `hidInterface` are only checked when both the model requires it, and a value is provided.
 */
export function findModelByUsb(
	vendorId: number,
	productId: number,
	usage?: number,
	hidInterface?: number,
): StreamDeckModelInfo | undefined {
	for (const model of ALL_MODEL_INFO) {
		for (const match of model.usb) {
			if (match.vendorId !== vendorId || match.productId !== productId) continue
			if (match.hidUsage !== undefined && usage !== undefined && usage !== match.hidUsage) continue
			if (match.hidInterface !== undefined && hidInterface !== undefined && hidInterface !== match.hidInterface)
				continue

			return model
		}
	}

	return undefined
}

/**
 * @deprecated Use `DEVICE_MODEL_INFO[id].name` instead
 */
export const MODEL_NAMES: { [key in DeviceModelId]: string } = Object.freeze(
	Object.fromEntries(ALL_MODEL_INFO.map((info) => [info.id, info.name])),
) as { [key in DeviceModelId]: string }
