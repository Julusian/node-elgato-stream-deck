import { HIDDevice } from '../device'
import { BMP_HEADER_LENGTH, imageToByteArray, writeBMPHeader } from '../util'
import { InternalFillImageOptions, OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen1Base } from './base-gen1'
import { DeviceModelId } from './id'

const miniProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.MINI,
	PRODUCT_NAME: 'Streamdeck Mini',
	COLUMNS: 3,
	ROWS: 2,
	ICON_SIZE: 80,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 1,
}

export class StreamDeckMini extends StreamDeckGen1Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, miniProperties)
	}

	protected async convertFillImage(sourceBuffer: Buffer, sourceOptions: InternalFillImageOptions): Promise<Buffer> {
		const byteBuffer = imageToByteArray(
			sourceBuffer,
			sourceOptions,
			BMP_HEADER_LENGTH,
			this.rotateCoordinates.bind(this),
			'bgr',
			this.ICON_SIZE
		)
		writeBMPHeader(byteBuffer, this.ICON_SIZE, this.ICON_BYTES, 2835)
		return Promise.resolve(byteBuffer)
	}

	protected getFillImagePacketLength(): number {
		return 1024
	}

	private rotateCoordinates(x: number, y: number): { x: number; y: number } {
		return { x: this.ICON_SIZE - y - 1, y: x }
	}
}
