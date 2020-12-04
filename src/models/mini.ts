import { BMP_HEADER_LENGTH, imageToByteArray, writeBMPHeader } from '../util'
import { OpenStreamDeckOptions, StreamDeckBase, StreamDeckProperties } from './base'
import { DeviceModelId, KeyIndex, StreamDeckDeviceInfo } from './id'

const miniProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.MINI,
	COLUMNS: 3,
	ROWS: 2,
	ICON_SIZE: 80,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 1,
}

export class StreamDeckMini extends StreamDeckBase {
	constructor(deviceInfo: StreamDeckDeviceInfo, options: OpenStreamDeckOptions) {
		super(deviceInfo, options, miniProperties)
	}

	protected transformKeyIndex(keyIndex: KeyIndex): KeyIndex {
		return keyIndex
	}

	protected convertFillImage(sourceBuffer: Buffer, sourceOffset: number, sourceStride: number): Buffer {
		const byteBuffer = imageToByteArray(
			sourceBuffer,
			sourceOffset,
			sourceStride,
			BMP_HEADER_LENGTH,
			this.rotateCoordinates.bind(this),
			'bgr',
			this.ICON_SIZE
		)
		writeBMPHeader(byteBuffer, this.ICON_SIZE, this.ICON_BYTES, 2835)
		return byteBuffer
	}

	protected getFillImagePacketLength(): number {
		return 1024
	}

	private rotateCoordinates(x: number, y: number): { x: number; y: number } {
		return { x: this.ICON_SIZE - y - 1, y: x }
	}
}
