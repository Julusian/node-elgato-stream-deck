import { DeviceModelId, StreamDeckMini, StreamDeckOriginal, StreamDeckXL } from './models'

export { HIDDevice } from './device'
export { DeviceModelId, KeyIndex, StreamDeck, OpenStreamDeckOptions } from './models'

export const VENDOR_ID = 0x0fd9

export const DEVICE_MODELS = [
	{
		id: DeviceModelId.ORIGINAL,
		productId: 0x0060,
		class: StreamDeckOriginal
	},
	{
		id: DeviceModelId.MINI,
		productId: 0x0063,
		class: StreamDeckMini
	},
	{
		id: DeviceModelId.XL,
		productId: 0x006c,
		class: StreamDeckXL
	}
]
