import { HIDDevice } from '../device'
import { BMP_HEADER_LENGTH, transformImageBuffer, writeBMPHeader } from '../util'
import { InternalFillImageOptions, OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen1Base } from './base-gen1'
import { DeviceModelId } from '../id'

const miniProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.MINI,
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

export class StreamDeckMini extends StreamDeckGen1Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, miniProperties)
	}

	protected async convertFillImage(sourceBuffer: Buffer, sourceOptions: InternalFillImageOptions): Promise<Buffer> {
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

	protected getFillImagePacketLength(): number {
		return 1024
	}
}
