import type { HIDDevice } from './hid-device.js'
import { DeviceModelId, MODEL_NAMES } from './id.js'
import type { StreamDeck } from './types.js'
import type { OpenStreamDeckOptions } from './models/base.js'
import { StreamDeckOriginalFactory } from './models/original.js'
import { StreamDeck6KeyFactory } from './models/6-key.js'
import { StreamDeck32KeyFactory } from './models/32-key.js'
import { StreamDeck15KeyFactory } from './models/15-key.js'
import { StreamDeckPlusFactory } from './models/plus.js'
import { StreamDeckPedalFactory } from './models/pedal.js'
import { StreamDeckNeoFactory } from './models/neo.js'
import { StreamDeckStudioFactory } from './models/studio.js'
import type { PropertiesService } from './services/properties/interface.js'
import { NetworkDockFactory } from './models/network-dock.js'
import { GalleonK100Factory } from './models/galleon-k100.js'

export * from './types.js'
export * from './id.js'
export * from './controlDefinition.js'
export type { PreparedBuffer } from './preparedBuffer.js'
export type { HIDDevice, HIDDeviceInfo, HIDDeviceEvents, ChildHIDDeviceInfo } from './hid-device.js'
export type { OpenStreamDeckOptions } from './models/base.js'
export { StreamDeckProxy } from './proxy.js'
export type { PropertiesService } from './services/properties/interface.js'
export { uint8ArrayToDataView } from './util.js'
export { parseAllFirmwareVersionsHelper } from './services/properties/all-firmware.js'

/** Elgato vendor id */
export const VENDOR_ID = 0x0fd9
/** Corsair vendor id */
export const CORSAIR_VENDOR_ID = 0x1b1c

export enum DeviceModelType {
	STREAMDECK = 'streamdeck',
	PEDAL = 'pedal',
	NETWORK_DOCK = 'network-dock',
}

export interface DeviceModelSpec {
	id: DeviceModelId
	type: DeviceModelType
	productIds: number[]
	vendorId: number
	productName: string
	/**
	 * If needing to filter by usage
	 */
	hidUsage?: number
	/**
	 * If needing to filter by interface number
	 */
	hidInterface?: number

	factory: (
		device: HIDDevice,
		options: Required<OpenStreamDeckOptions>,
		tcpPropertiesService?: PropertiesService,
	) => StreamDeck | Promise<StreamDeck>

	hasNativeTcp: boolean
}

/** List of all the known models, and the classes to use them */
export const DEVICE_MODELS2: { [key in DeviceModelId]: Omit<DeviceModelSpec, 'id' | 'productName'> } = {
	[DeviceModelId.ORIGINAL]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x0060],
		vendorId: VENDOR_ID,
		factory: StreamDeckOriginalFactory,

		hasNativeTcp: false,
	},
	[DeviceModelId.MINI]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x0063, 0x0090, 0x00b3],
		vendorId: VENDOR_ID,
		factory: (...args) => StreamDeck6KeyFactory(DeviceModelId.MINI, ...args),

		hasNativeTcp: false,
	},
	[DeviceModelId.XL]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x006c, 0x008f],
		vendorId: VENDOR_ID,
		factory: (...args) => StreamDeck32KeyFactory(DeviceModelId.XL, ...args),

		hasNativeTcp: false,
	},
	[DeviceModelId.ORIGINALV2]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x006d],
		vendorId: VENDOR_ID,
		factory: (...args) => StreamDeck15KeyFactory(DeviceModelId.ORIGINALV2, ...args),

		hasNativeTcp: false,
	},
	[DeviceModelId.ORIGINALMK2]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x0080],
		vendorId: VENDOR_ID,
		factory: (...args) => StreamDeck15KeyFactory(DeviceModelId.ORIGINALMK2, ...args),

		hasNativeTcp: false,
	},
	[DeviceModelId.ORIGINALMK2SCISSOR]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x00a5],
		vendorId: VENDOR_ID,
		factory: (...args) => StreamDeck15KeyFactory(DeviceModelId.ORIGINALMK2SCISSOR, ...args),

		hasNativeTcp: false,
	},
	[DeviceModelId.PLUS]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x0084],
		vendorId: VENDOR_ID,
		factory: StreamDeckPlusFactory,

		hasNativeTcp: false,
	},
	[DeviceModelId.PEDAL]: {
		type: DeviceModelType.PEDAL,
		productIds: [0x0086],
		vendorId: VENDOR_ID,
		factory: StreamDeckPedalFactory,

		hasNativeTcp: false,
	},
	[DeviceModelId.NEO]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x009a],
		vendorId: VENDOR_ID,
		factory: StreamDeckNeoFactory,

		hasNativeTcp: false,
	},
	[DeviceModelId.STUDIO]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x00aa],
		vendorId: VENDOR_ID,
		factory: StreamDeckStudioFactory,

		hasNativeTcp: true,
	},
	[DeviceModelId.MODULE6]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x00b8],
		vendorId: VENDOR_ID,
		factory: (...args) => StreamDeck6KeyFactory(DeviceModelId.MODULE6, ...args),

		hasNativeTcp: false,
	},
	[DeviceModelId.MODULE15]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x00b9],
		vendorId: VENDOR_ID,
		factory: (...args) => StreamDeck15KeyFactory(DeviceModelId.MODULE15, ...args),

		hasNativeTcp: false,
	},
	[DeviceModelId.MODULE32]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x00ba],
		vendorId: VENDOR_ID,
		factory: (...args) => StreamDeck32KeyFactory(DeviceModelId.MODULE32, ...args),

		hasNativeTcp: false,
	},
	[DeviceModelId.NETWORK_DOCK]: {
		type: DeviceModelType.NETWORK_DOCK,
		productIds: [0xffff], // Note: This isn't a real product id, but matches what is reported when querying the device
		vendorId: VENDOR_ID,
		factory: NetworkDockFactory,

		hasNativeTcp: true,
	},
	[DeviceModelId.GALLEON_K100]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x2b18],
		vendorId: CORSAIR_VENDOR_ID,
		factory: GalleonK100Factory,

		hidUsage: 0x01,
		hidInterface: 0,

		hasNativeTcp: false,
	},
}

/** @deprecated maybe? */
export const DEVICE_MODELS: DeviceModelSpec[] = Object.entries<Omit<DeviceModelSpec, 'id' | 'productName'>>(
	DEVICE_MODELS2,
).map(([id, spec]) => {
	const modelId = id as any as DeviceModelId
	return { id: modelId, productName: MODEL_NAMES[modelId], ...spec }
})

export function getStreamDeckModelName(modelId: DeviceModelId): string {
	return MODEL_NAMES[modelId] || 'Unknown Stream Deck'
}
