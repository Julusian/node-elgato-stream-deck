import type { StreamDeckControlDefinition } from './controlDefinition.js'
import { DeviceModelId, MODEL_NAMES } from './id.js'
import type { StreamDeckProperties } from './models/base.js'
import {
	base15KeyProperties,
	base32KeyProperties,
	base6KeyProperties,
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
 * The static properties of a model, as defined in `models/definitions.ts`.
 * The gen1 models omit the properties which are always false for them.
 */
type StaticModelProperties = Pick<StreamDeckProperties, 'controls'> &
	Partial<Pick<StreamDeckProperties, 'hasNfcReader' | 'supportsChildDevices'>>

interface ModelInfoOptions {
	/** Defaults to `DeviceModelType.STREAMDECK` */
	category?: DeviceModelType
	/** Defaults to Elgato */
	manufacturer?: string
	usb: UsbMatch[]
	/** Whether the device can be connected to directly over tcp */
	nativeTcp?: boolean
}

function createModelInfo(
	id: DeviceModelId,
	properties: StaticModelProperties,
	options: ModelInfoOptions,
): StreamDeckModelInfo {
	const transports: StreamDeckTransport[] = []
	if (options.usb.length > 0) transports.push('usb')
	if (options.nativeTcp) transports.push('tcp')

	return Object.freeze({
		id,
		name: MODEL_NAMES[id],
		manufacturer: options.manufacturer ?? MANUFACTURER_ELGATO,
		category: options.category ?? DeviceModelType.STREAMDECK,

		usb: Object.freeze(options.usb.map((match) => Object.freeze(match))),
		transports: Object.freeze(transports),

		controls: properties.controls,
		features: Object.freeze({
			nfcReader: properties.hasNfcReader ?? false,
			childDevices: properties.supportsChildDevices ?? false,
		}),
	})
}

/**
 * Static information about every known model.
 * @experimental Will become DEVICE_MODELS in v8
 */
export const DEVICE_MODEL_INFO: Readonly<{ [id in DeviceModelId]: StreamDeckModelInfo }> = Object.freeze({
	[DeviceModelId.ORIGINAL]: createModelInfo(DeviceModelId.ORIGINAL, originalProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x0060 }],
	}),
	[DeviceModelId.MINI]: createModelInfo(DeviceModelId.MINI, base6KeyProperties, {
		usb: [
			{ vendorId: VENDOR_ID, productId: 0x0063 },
			{ vendorId: VENDOR_ID, productId: 0x0090 },
			{ vendorId: VENDOR_ID, productId: 0x00b3 },
		],
	}),
	[DeviceModelId.XL]: createModelInfo(DeviceModelId.XL, base32KeyProperties, {
		usb: [
			{ vendorId: VENDOR_ID, productId: 0x006c },
			{ vendorId: VENDOR_ID, productId: 0x008f },
		],
	}),
	[DeviceModelId.ORIGINALV2]: createModelInfo(DeviceModelId.ORIGINALV2, base15KeyProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x006d }],
	}),
	[DeviceModelId.ORIGINALMK2]: createModelInfo(DeviceModelId.ORIGINALMK2, base15KeyProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x0080 }],
	}),
	[DeviceModelId.ORIGINALMK2SCISSOR]: createModelInfo(DeviceModelId.ORIGINALMK2SCISSOR, base15KeyProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x00a5 }],
	}),
	[DeviceModelId.PLUS]: createModelInfo(DeviceModelId.PLUS, plusProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x0084 }],
	}),
	[DeviceModelId.PEDAL]: createModelInfo(DeviceModelId.PEDAL, pedalProperties, {
		category: DeviceModelType.PEDAL,
		usb: [{ vendorId: VENDOR_ID, productId: 0x0086 }],
	}),
	[DeviceModelId.NEO]: createModelInfo(DeviceModelId.NEO, neoProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x009a }],
	}),
	[DeviceModelId.STUDIO]: createModelInfo(DeviceModelId.STUDIO, studioProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x00aa }],
		nativeTcp: true,
	}),
	[DeviceModelId.MODULE6]: createModelInfo(DeviceModelId.MODULE6, base6KeyProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x00b8 }],
	}),
	[DeviceModelId.MODULE15]: createModelInfo(DeviceModelId.MODULE15, base15KeyProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x00b9 }],
	}),
	[DeviceModelId.MODULE32]: createModelInfo(DeviceModelId.MODULE32, base32KeyProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x00ba }],
	}),
	[DeviceModelId.NETWORK_DOCK]: createModelInfo(DeviceModelId.NETWORK_DOCK, networkDockProperties, {
		category: DeviceModelType.NETWORK_DOCK,
		usb: [], // This is not a usb device
		nativeTcp: true,
	}),
	[DeviceModelId.GALLEON_K100]: createModelInfo(DeviceModelId.GALLEON_K100, galleonK100Properties, {
		manufacturer: MANUFACTURER_CORSAIR,
		usb: [{ vendorId: CORSAIR_VENDOR_ID, productId: 0x2b18, hidUsage: 0x01, hidInterface: 0 }],
	}),
	[DeviceModelId.PLUS_XL]: createModelInfo(DeviceModelId.PLUS_XL, plusXlProperties, {
		usb: [{ vendorId: VENDOR_ID, productId: 0x00c6 }],
	}),
})

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
