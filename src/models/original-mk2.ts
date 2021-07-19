import { OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId, StreamDeckDeviceInfo } from './id'

const origMK2Properties: StreamDeckProperties = {
	MODEL: DeviceModelId.ORIGINALMK2,
	COLUMNS: 5,
	ROWS: 3,
	ICON_SIZE: 72,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 4
}

export class StreamDeckOriginalMK2 extends StreamDeckGen2Base {
	constructor(deviceInfo: StreamDeckDeviceInfo, options: OpenStreamDeckOptions) {
		super(deviceInfo, options, origMK2Properties)
	}
}
