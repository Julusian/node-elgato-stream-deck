import { OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId, StreamDeckDeviceInfo } from './id'

const miniV2Properties: StreamDeckProperties = {
	MODEL: DeviceModelId.MINIV2,
	COLUMNS: 3,
	ROWS: 2,
	ICON_SIZE: 80,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 4
}

export class StreamDeckMiniV2 extends StreamDeckGen2Base {
	constructor(deviceInfo: StreamDeckDeviceInfo, options: OpenStreamDeckOptions) {
		super(deviceInfo, options, miniV2Properties)
	}
}
