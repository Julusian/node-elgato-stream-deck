import { HIDDevice } from '../device'
import { OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId } from './id'

const plusProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.PLUS,
	PRODUCT_NAME: 'Streamdeck +',
	COLUMNS: 4,
	ROWS: 2,
	ICON_SIZE: 120,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 4,
}

export class StreamDeckPlus extends StreamDeckGen2Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, plusProperties, true)
	}
}
