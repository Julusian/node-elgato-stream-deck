import { HIDDevice } from './hid-device.js'
import { DeviceModelId } from './id.js'
import { StreamDeck } from './types.js'
import { OpenStreamDeckOptions } from './models/base.js'
import { StreamDeckOriginalFactory } from './models/original.js'
import { StreamDeckMiniFactory } from './models/mini.js'
import { StreamDeckXLFactory } from './models/xl.js'
import { StreamDeckOriginalV2Factory } from './models/originalv2.js'
import { StreamDeckOriginalMK2Factory } from './models/original-mk2.js'
import { StreamDeckPlusFactory } from './models/plus.js'
import { StreamDeckPedalFactory } from './models/pedal.js'
import { StreamDeckNeoFactory } from './models/neo.js'

export * from './types.js'
export * from './id.js'
export * from './controlDefinition.js'
export { HIDDevice, HIDDeviceInfo, HIDDeviceEvents } from './hid-device.js'
export { OpenStreamDeckOptions } from './models/base.js'
export { StreamDeckProxy } from './proxy.js'

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
	factory: (device: HIDDevice, options: Required<OpenStreamDeckOptions>) => StreamDeck
}

/** List of all the known models, and the classes to use them */
export const DEVICE_MODELS2: { [key in DeviceModelId]: Omit<DeviceModelSpec, 'id'> } = {
	[DeviceModelId.ORIGINAL]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x0060],
		factory: StreamDeckOriginalFactory,
	},
	[DeviceModelId.MINI]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x0063, 0x0090],
		factory: StreamDeckMiniFactory,
	},
	[DeviceModelId.XL]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x006c, 0x008f],
		factory: StreamDeckXLFactory,
	},
	[DeviceModelId.ORIGINALV2]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x006d],
		factory: StreamDeckOriginalV2Factory,
	},
	[DeviceModelId.ORIGINALMK2]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x0080],
		factory: StreamDeckOriginalMK2Factory,
	},
	[DeviceModelId.PLUS]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x0084],
		factory: StreamDeckPlusFactory,
	},
	[DeviceModelId.PEDAL]: {
		type: DeviceModelType.PEDAL,
		productIds: [0x0086],
		factory: StreamDeckPedalFactory,
	},
	[DeviceModelId.NEO]: {
		type: DeviceModelType.STREAMDECK,
		productIds: [0x009a],
		factory: StreamDeckNeoFactory,
	},
}

/** @deprecated maybe? */
export const DEVICE_MODELS: DeviceModelSpec[] = Object.entries<Omit<DeviceModelSpec, 'id'>>(DEVICE_MODELS2).map(
	([id, spec]) => ({
		id: id as any as DeviceModelId,
		...spec,
	}),
)
