import type { HIDDevice } from './hid-device.js'
import { DeviceModelId, MODEL_NAMES } from './id.js'
import type { StreamDeck } from './types.js'
import type { OpenStreamDeckOptions } from './models/base.js'
import { StreamDeckOriginalFactory } from './models/original.js'
import { StreamDeckMiniFactory } from './models/mini.js'
import { StreamDeckXLFactory } from './models/xl.js'
import { StreamDeckOriginalV2Factory } from './models/originalv2.js'
import { StreamDeckOriginalMK2Factory } from './models/original-mk2.js'
import { StreamDeckPlusFactory } from './models/plus.js'
import { StreamDeckPedalFactory } from './models/pedal.js'
import { StreamDeckNeoFactory } from './models/neo.js'
import { StreamDeckStudioFactory } from './models/studio.js'
import type { PropertiesService } from './services/properties/interface.js'

export * from './types.js'
export * from './id.js'
export * from './controlDefinition.js'
export type { HIDDevice, HIDDeviceInfo, HIDDeviceEvents, ChildHIDDeviceInfo } from './hid-device.js'
export type { OpenStreamDeckOptions } from './models/base.js'
export { StreamDeckProxy } from './proxy.js'
export type { PropertiesService } from './services/properties/interface.js'
export { uint8ArrayToDataView } from './util.js'
export { parseAllFirmwareVersionsHelper } from './services/properties/all-firmware.js'

/** Elgato vendor id */
export const VENDOR_ID = 0x0fd9

export enum DeviceModelType {
	STREAMDECK = 'streamdeck',
	PEDAL = 'pedal',
}

export interface DeviceModelSpec {
	id: DeviceModelId
	type: DeviceModelType
	productIds: number[]
	productName: string

	factory: (
		device: HIDDevice,
		options: Required<OpenStreamDeckOptions>,
		propertiesService?: PropertiesService,
	) => StreamDeck

	hasNativeTcp: boolean
}

/** List of all the known models, and the classes to use them */
export const DEVICE_MODELS2: { [key in DeviceModelId]: Omit<DeviceModelSpec, 'id' | 'productName'> } = {
	[DeviceModelId.ORIGINAL]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x0060],
		factory: StreamDeckOriginalFactory,

		hasNativeTcp: false,
	},
	[DeviceModelId.MINI]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x0063, 0x0090],
		factory: StreamDeckMiniFactory,

		hasNativeTcp: false,
	},
	[DeviceModelId.XL]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x006c, 0x008f],
		factory: StreamDeckXLFactory,

		hasNativeTcp: false,
	},
	[DeviceModelId.ORIGINALV2]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x006d],
		factory: StreamDeckOriginalV2Factory,

		hasNativeTcp: false,
	},
	[DeviceModelId.ORIGINALMK2]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x0080],
		factory: StreamDeckOriginalMK2Factory,

		hasNativeTcp: false,
	},
	[DeviceModelId.PLUS]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x0084],
		factory: StreamDeckPlusFactory,

		hasNativeTcp: false,
	},
	[DeviceModelId.PEDAL]: {
		type: DeviceModelType.PEDAL,
		productIds: [0x0086],
		factory: StreamDeckPedalFactory,

		hasNativeTcp: false,
	},
	[DeviceModelId.NEO]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x009a],
		factory: StreamDeckNeoFactory,

		hasNativeTcp: false,
	},
	[DeviceModelId.STUDIO]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x00aa],
		factory: StreamDeckStudioFactory,

		hasNativeTcp: true,
	},
}

/** @deprecated maybe? */
export const DEVICE_MODELS: DeviceModelSpec[] = Object.entries<Omit<DeviceModelSpec, 'id' | 'productName'>>(
	DEVICE_MODELS2,
).map(([id, spec]) => {
	const modelId = id as any as DeviceModelId
	return {
		id: modelId,
		productName: MODEL_NAMES[modelId],
		...spec,
	}
})
