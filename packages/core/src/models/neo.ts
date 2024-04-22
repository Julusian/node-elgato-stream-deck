import { HIDDevice } from '../device'
import { OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { DeviceModelId } from '../id'
import { StreamDeckGen2Base } from './base-gen2'

const neoProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.NEO,
	PRODUCT_NAME: 'Streamdeck Neo',
	COLUMNS: 4,
	ROWS: 2,
	TOUCH_BUTTONS: 2,
	ICON_SIZE: 96,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 3,

	KEY_SPACING_HORIZONTAL: 30,
	KEY_SPACING_VERTICAL: 30,
}

export class StreamDeckNeo extends StreamDeckGen2Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, neoProperties)
	}

	// protected async convertFillImage(sourceBuffer: Buffer, sourceOptions: InternalFillImageOptions): Promise<Buffer> {
	// 	const byteBuffer = imageToByteArray(
	// 		sourceBuffer,
	// 		sourceOptions,
	// 		{ colorMode: 'bgr', rotate: true, yFlip: true },
	// 		BMP_HEADER_LENGTH,
	// 		this.ICON_SIZE
	// 	)
	// 	writeBMPHeader(byteBuffer, this.ICON_SIZE, this.ICON_BYTES, 2835)
	// 	return Promise.resolve(byteBuffer)
	// }

	// protected getFillImagePacketLength(): number {
	// 	return 1024
	// }
}
