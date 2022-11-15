import { HIDDevice } from '../device'
import { OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId } from '../id'

const xlProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.XL,
	PRODUCT_NAME: 'Streamdeck XL',
	COLUMNS: 8,
	ROWS: 4,
	ICON_SIZE: 96,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 3,
}

export class StreamDeckXL extends StreamDeckGen2Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, xlProperties)
	}
}
