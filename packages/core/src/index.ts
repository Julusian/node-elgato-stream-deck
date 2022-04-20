import { HIDDevice } from './device'
import {
	DeviceModelId,
	StreamDeckMini,
	StreamDeckOriginal,
	StreamDeckOriginalV2,
	StreamDeckOriginalMK2,
	StreamDeckXL,
	OpenStreamDeckOptions,
	StreamDeck,
} from './models'
import { StreamDeckPedal } from './models/pedal'

export { HIDDevice } from './device'
export {
	DeviceModelId,
	KeyIndex,
	StreamDeck,
	OpenStreamDeckOptions,
	FillImageOptions,
	FillPanelOptions,
} from './models'
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
export const DEVICE_MODELS: DeviceModelSpec[] = [
	{
		id: DeviceModelId.ORIGINAL,
		type: DeviceModelType.STREAMDECK,
		productId: 0x0060,
		class: StreamDeckOriginal,
	},
	{
		id: DeviceModelId.MINI,
		type: DeviceModelType.STREAMDECK,
		productId: 0x0063,
		class: StreamDeckMini,
	},
	{
		id: DeviceModelId.XL,
		type: DeviceModelType.STREAMDECK,
		productId: 0x006c,
		class: StreamDeckXL,
	},
	{
		id: DeviceModelId.ORIGINALV2,
		type: DeviceModelType.STREAMDECK,
		productId: 0x006d,
		class: StreamDeckOriginalV2,
	},
	{
		id: DeviceModelId.ORIGINALMK2,
		type: DeviceModelType.STREAMDECK,
		productId: 0x0080,
		class: StreamDeckOriginalMK2,
	},
	{
		id: DeviceModelId.PEDAL,
		type: DeviceModelType.PEDAL,
		productId: 0x0086,
		class: StreamDeckPedal,
	},
]
