import type { StreamdeckImageHeaderGenerator, StreamdeckImageWriterProps } from './types.js'

export class StreamdeckGen1ImageHeaderGenerator implements StreamdeckImageHeaderGenerator {
	getFillImageCommandHeaderLength(): number {
		return 16
	}

	writeFillImageCommandHeader(
		buffer: Buffer,
		props: StreamdeckImageWriterProps,
		partIndex: number,
		isLast: boolean,
		_bodyLength: number,
	): void {
		buffer.writeUInt8(0x02, 0)
		buffer.writeUInt8(0x01, 1)
		buffer.writeUInt16LE(partIndex, 2)
		// 3 = 0x00
		buffer.writeUInt8(isLast ? 1 : 0, 4)
		buffer.writeUInt8(props.keyIndex + 1, 5)
	}
}

export class StreamdeckGen2ImageHeaderGenerator implements StreamdeckImageHeaderGenerator {
	getFillImageCommandHeaderLength(): number {
		return 8
	}

	writeFillImageCommandHeader(
		buffer: Buffer,
		props: StreamdeckImageWriterProps,
		partIndex: number,
		isLast: boolean,
		bodyLength: number,
	): void {
		buffer.writeUInt8(0x02, 0)
		buffer.writeUInt8(0x07, 1)
		buffer.writeUInt8(props.keyIndex, 2)
		buffer.writeUInt8(isLast ? 1 : 0, 3)
		buffer.writeUInt16LE(bodyLength, 4)
		buffer.writeUInt16LE(partIndex++, 6)
	}
}

export interface StreamdeckPlusHeaderProps {
	x: number
	y: number
	width: number
	height: number
}
export class StreamdeckPlusLcdImageHeaderGenerator
	implements StreamdeckImageHeaderGenerator<StreamdeckPlusHeaderProps>
{
	getFillImageCommandHeaderLength(): number {
		return 16
	}

	writeFillImageCommandHeader(
		buffer: Buffer,
		props: StreamdeckPlusHeaderProps,
		partIndex: number,
		isLast: boolean,
		bodyLength: number,
	): void {
		buffer.writeUInt8(0x02, 0)
		buffer.writeUInt8(0x0c, 1)
		buffer.writeUInt16LE(props.x, 2)
		buffer.writeUInt16LE(props.y, 4)
		buffer.writeUInt16LE(props.width, 6)
		buffer.writeUInt16LE(props.height, 8)
		buffer.writeUInt8(isLast ? 1 : 0, 10) // Is last
		buffer.writeUInt16LE(partIndex, 11)
		buffer.writeUInt16LE(bodyLength, 13)
	}
}

export class StreamdeckNeoLcdImageHeaderGenerator implements StreamdeckImageHeaderGenerator<null> {
	getFillImageCommandHeaderLength(): number {
		return 8
	}

	writeFillImageCommandHeader(
		buffer: Buffer,
		_props: never,
		partIndex: number,
		isLast: boolean,
		bodyLength: number,
	): void {
		buffer.writeUInt8(0x02, 0)
		buffer.writeUInt8(0x0b, 1)
		buffer.writeUInt8(0, 2)
		buffer.writeUInt8(isLast ? 1 : 0, 3)
		buffer.writeUInt16LE(bodyLength, 4)
		buffer.writeUInt16LE(partIndex++, 6)
	}
}
