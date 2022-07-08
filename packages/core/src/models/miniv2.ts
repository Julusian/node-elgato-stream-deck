import { HIDDevice } from '../device'
import { OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId } from './id'

const miniV2Properties: StreamDeckProperties = {
	MODEL: DeviceModelId.MINIV2,
	PRODUCT_NAME: 'Streamdeck Mini',
	COLUMNS: 2,
	ROWS: 2,
	ICON_SIZE: 80,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 4,
}

export class StreamDeckMiniV2 extends StreamDeckGen2Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, miniV2Properties)
	}
}
