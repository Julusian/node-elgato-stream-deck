import { HIDDevice } from '../device'
import { OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId } from './id'

const origV2Properties: StreamDeckProperties = {
	MODEL: DeviceModelId.ORIGINALV2,
	COLUMNS: 5,
	ROWS: 3,
	ICON_SIZE: 72,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 4,
}

export class StreamDeckOriginalV2 extends StreamDeckGen2Base {
	constructor(device: HIDDevice, options: OpenStreamDeckOptions) {
		super(device, options, origV2Properties)
	}
}
