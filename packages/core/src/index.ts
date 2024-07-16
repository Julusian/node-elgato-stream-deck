import { HIDDevice } from './hid-device'
import { DeviceModelId } from './id'
import { StreamDeck } from './types'
import { OpenStreamDeckOptions } from './models/base'
import { StreamDeckOriginalFactory } from './models/original'
import { StreamDeckMiniFactory } from './models/mini'
import { StreamDeckXLFactory } from './models/xl'
import { StreamDeckOriginalV2Factory } from './models/originalv2'
import { StreamDeckOriginalMK2Factory } from './models/original-mk2'
import { StreamDeckPlusFactory } from './models/plus'
import { StreamDeckPedalFactory } from './models/pedal'
import { StreamDeckNeoFactory } from './models/neo'

export * from './types'
export * from './id'
export { HIDDevice, HIDDeviceInfo, HIDDeviceEvents } from './hid-device'
export { OpenStreamDeckOptions } from './models/base'
export { StreamDeckProxy } from './proxy'

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
	})
)
