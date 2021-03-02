import { HIDDevice } from './device'
import { DeviceModelId, StreamDeckMini, StreamDeckOriginal, StreamDeckOriginalV2, StreamDeckXL } from './models'
import { OpenStreamDeckOptions, StreamDeck } from './models/base'

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

export const VENDOR_ID = 0x0fd9

export interface DeviceModelSpec {
	id: DeviceModelId
	productId: number
	class: new (device: HIDDevice, options: Required<OpenStreamDeckOptions>) => StreamDeck
}

export const DEVICE_MODELS: DeviceModelSpec[] = [
	{
		id: DeviceModelId.ORIGINAL,
		productId: 0x0060,
		class: StreamDeckOriginal,
	},
	{
		id: DeviceModelId.MINI,
		productId: 0x0063,
		class: StreamDeckMini,
	},
	{
		id: DeviceModelId.XL,
		productId: 0x006c,
		class: StreamDeckXL,
	},
	{
		id: DeviceModelId.ORIGINALV2,
		productId: 0x006d,
		class: StreamDeckOriginalV2,
	},
]
