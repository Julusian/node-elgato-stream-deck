import { OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId, StreamDeckDeviceInfo } from './id'

const xlProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.XL,
	COLUMNS: 8,
	ROWS: 4,
	ICON_SIZE: 96,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 4,
}

export class StreamDeckXL extends StreamDeckGen2Base {
	constructor(deviceInfo: StreamDeckDeviceInfo, options: OpenStreamDeckOptions) {
		super(deviceInfo, options, xlProperties)
	}
}
