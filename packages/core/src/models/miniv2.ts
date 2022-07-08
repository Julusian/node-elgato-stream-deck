import { HIDDevice } from '../device'
import { BMP_HEADER_LENGTH, imageToByteArray, writeBMPHeader } from '../util'
import { InternalFillImageOptions, OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen1Base } from './base-gen1'
import { DeviceModelId } from './id'

const miniV2Properties: StreamDeckProperties = {
	MODEL: DeviceModelId.MINIV2,
	PRODUCT_NAME: 'Streamdeck Mini',
	COLUMNS: 3,
	ROWS: 2,
	ICON_SIZE: 80,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 1,
}

export class StreamDeckMiniV2 extends StreamDeckGen1Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, miniV2Properties)
	}

	protected async convertFillImage(sourceBuffer: Buffer, sourceOptions: InternalFillImageOptions): Promise<Buffer> {
		const byteBuffer = imageToByteArray(
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

	public async getSerialNumber(): Promise<string> {
		const val = await this.device.getFeatureReport(3, 32)
		return val.toString('ascii', 5, 17)
	}
}
