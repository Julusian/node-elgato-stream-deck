import { HIDDevice } from './device'
import { DeviceModelId } from './id'
import {
	StreamDeckMini,
	StreamDeckMiniV2,
	StreamDeckOriginal,
	StreamDeckOriginalV2,
	StreamDeckOriginalMK2,
	StreamDeckXL,
	StreamDeckXLV2,
	StreamDeckPedal,
	StreamDeckNeo,
	StreamDeckPlus,
	OpenStreamDeckOptions,
} from './models'
import { StreamDeck } from './types'

export * from './types'
export * from './id'
export { HIDDevice, HIDDeviceInfo, HIDDeviceEvents } from './device'
export { OpenStreamDeckOptions } from './models'
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
	productId: number
	class: new (device: HIDDevice, options: Required<OpenStreamDeckOptions>) => StreamDeck
}

/** List of all the known models, and the classes to use them */
export const DEVICE_MODELS2: { [key in DeviceModelId]: Omit<DeviceModelSpec, 'id'> } = {
	[DeviceModelId.ORIGINAL]: {
		type: DeviceModelType.STREAMDECK,
		productId: 0x0060,
		class: StreamDeckOriginal,
	},
	[DeviceModelId.MINI]: {
		type: DeviceModelType.STREAMDECK,
		productId: 0x0063,
		class: StreamDeckMini,
	},
	[DeviceModelId.XL]: {
		type: DeviceModelType.STREAMDECK,
		productId: 0x006c,
		class: StreamDeckXL,
	},
	[DeviceModelId.ORIGINALV2]: {
		type: DeviceModelType.STREAMDECK,
		productId: 0x006d,
		class: StreamDeckOriginalV2,
	},
	[DeviceModelId.ORIGINALMK2]: {
		type: DeviceModelType.STREAMDECK,
		productId: 0x0080,
		class: StreamDeckOriginalMK2,
	},
	[DeviceModelId.PLUS]: {
		type: DeviceModelType.STREAMDECK,
		productId: 0x0084,
		class: StreamDeckPlus,
	},
	[DeviceModelId.PEDAL]: {
		type: DeviceModelType.PEDAL,
		productId: 0x0086,
		class: StreamDeckPedal,
	},
	[DeviceModelId.XLV2]: {
		type: DeviceModelType.STREAMDECK,
		productId: 0x008f,
		class: StreamDeckXLV2,
	},
	[DeviceModelId.MINIV2]: {
		type: DeviceModelType.STREAMDECK,
		productId: 0x0090,
		class: StreamDeckMiniV2,
	},
	[DeviceModelId.NEO]: {
		type: DeviceModelType.STREAMDECK,
		productId: 0x009a,
		class: StreamDeckNeo,
	},
}

/** @deprecated maybe? */
export const DEVICE_MODELS: DeviceModelSpec[] = Object.entries<Omit<DeviceModelSpec, 'id'>>(DEVICE_MODELS2).map(
	([id, spec]) => ({
		id: id as any as DeviceModelId,
		...spec,
	})
)
