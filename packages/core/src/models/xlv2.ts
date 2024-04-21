import { HIDDevice } from '../device'
import { OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId } from '../id'

const xlProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.XLV2,
	PRODUCT_NAME: 'Streamdeck XL',
	COLUMNS: 8,
	ROWS: 4,
	ICON_SIZE: 96,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 3,

	KEY_SPACING_HORIZONTAL: 32,
	KEY_SPACING_VERTICAL: 39,
}

export class StreamDeckXLV2 extends StreamDeckGen2Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, xlProperties)
	}
}
