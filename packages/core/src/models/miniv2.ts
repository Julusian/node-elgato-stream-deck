import { HIDDevice } from '../device'
import { BMP_HEADER_LENGTH, transformImageBuffer, writeBMPHeader } from '../util'
import { InternalFillImageOptions, OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen1Base } from './base-gen1'
import { DeviceModelId } from '../id'

const miniV2Properties: StreamDeckProperties = {
	MODEL: DeviceModelId.MINIV2,
	PRODUCT_NAME: 'Streamdeck Mini',
	COLUMNS: 3,
	ROWS: 2,
	TOUCH_BUTTONS: 0,
	ICON_SIZE: 80,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 0,

	KEY_SPACING_HORIZONTAL: 28,
	KEY_SPACING_VERTICAL: 28,
}

export class StreamDeckMiniV2 extends StreamDeckGen1Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, miniV2Properties)
	}

	protected async convertFillImage(
		sourceBuffer: Uint8Array,
		sourceOptions: InternalFillImageOptions
	): Promise<Uint8Array> {
		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions,
			{ colorMode: 'bgr', rotate: true, yFlip: true },
			BMP_HEADER_LENGTH,
			this.ICON_SIZE
		)
		writeBMPHeader(byteBuffer, this.ICON_SIZE, this.ICON_BYTES, 2835)
		return Promise.resolve(byteBuffer)
	}
}
