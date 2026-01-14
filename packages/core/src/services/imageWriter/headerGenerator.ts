import { uint8ArrayToDataView } from '../../util.js'
import type { StreamdeckImageHeaderGenerator, StreamdeckImageWriterProps } from './types.js'

export class StreamdeckGen1ImageHeaderGenerator implements StreamdeckImageHeaderGenerator {
	getFillImageCommandHeaderLength(): number {
		return 16
	}

	writeFillImageCommandHeader(
		buffer: Uint8Array,
		props: StreamdeckImageWriterProps,
		partIndex: number,
		isLast: boolean,
		_bodyLength: number,
	): void {
		const bufferView = uint8ArrayToDataView(buffer)

		bufferView.setUint8(0, 0x02)
		bufferView.setUint8(1, 0x01)
		bufferView.setUint16(2, partIndex, true)
		bufferView.setUint8(4, isLast ? 1 : 0)
		bufferView.setUint8(5, props.keyIndex + 1)
	}
}

export class StreamdeckGen2ImageHeaderGenerator implements StreamdeckImageHeaderGenerator {
	getFillImageCommandHeaderLength(): number {
		return 8
	}

	writeFillImageCommandHeader(
		buffer: Uint8Array,
		props: StreamdeckImageWriterProps,
		partIndex: number,
		isLast: boolean,
		bodyLength: number,
	): void {
		const bufferView = uint8ArrayToDataView(buffer)

		bufferView.setUint8(0, 0x02)
		bufferView.setUint8(1, 0x07)
		bufferView.setUint8(2, props.keyIndex)
		bufferView.setUint8(3, isLast ? 1 : 0)
		bufferView.setUint16(4, bodyLength, true)
		bufferView.setUint16(6, partIndex++, true)
	}
}

export interface StreamdeckPlusHeaderProps {
	x: number
	y: number
	width: number
	height: number
}
export class StreamdeckPlusLcdImageHeaderGenerator implements StreamdeckImageHeaderGenerator<StreamdeckPlusHeaderProps> {
	getFillImageCommandHeaderLength(): number {
		return 16
	}

	writeFillImageCommandHeader(
		buffer: Uint8Array,
		props: StreamdeckPlusHeaderProps,
		partIndex: number,
		isLast: boolean,
		bodyLength: number,
	): void {
		const bufferView = uint8ArrayToDataView(buffer)

		bufferView.setUint8(0, 0x02)
		bufferView.setUint8(1, 0x0c)
		bufferView.setUint16(2, props.x, true)
		bufferView.setUint16(4, props.y, true)
		bufferView.setUint16(6, props.width, true)
		bufferView.setUint16(8, props.height, true)
		bufferView.setUint8(10, isLast ? 1 : 0)
		bufferView.setUint16(11, partIndex, true)
		bufferView.setUint16(13, bodyLength, true)
	}
}

export class StreamdeckNeoLcdImageHeaderGenerator implements StreamdeckImageHeaderGenerator<null> {
	getFillImageCommandHeaderLength(): number {
		return 8
	}

	writeFillImageCommandHeader(
		buffer: Uint8Array,
		_props: never,
		partIndex: number,
		isLast: boolean,
		bodyLength: number,
	): void {
		const bufferView = uint8ArrayToDataView(buffer)

		bufferView.setUint8(0, 0x02)
		bufferView.setUint8(1, 0x0b)
		bufferView.setUint8(2, 0)
		bufferView.setUint8(3, isLast ? 1 : 0)
		bufferView.setUint16(4, bodyLength, true)
		bufferView.setUint16(6, partIndex, true)
	}
}
