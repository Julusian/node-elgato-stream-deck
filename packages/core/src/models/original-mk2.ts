import { HIDDevice } from '../device'
import { OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId } from '../id'

const origMK2Properties: StreamDeckProperties = {
	MODEL: DeviceModelId.ORIGINALMK2,
	PRODUCT_NAME: 'Streamdeck MK2',
	COLUMNS: 5,
	ROWS: 3,
	ICON_SIZE: 72,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 3,

	KEY_SPACING_HORIZONTAL: 25,
	KEY_SPACING_VERTICAL: 25,
}

export class StreamDeckOriginalMK2 extends StreamDeckGen2Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, origMK2Properties)
	}
}
