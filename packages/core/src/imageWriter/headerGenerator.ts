import type { StreamdeckImageHeaderGenerator } from './types'

export class StreamdeckGen1ImageHeaderGenerator implements StreamdeckImageHeaderGenerator {
	getFillImageCommandHeaderLength(): number {
		return 16
	}

	writeFillImageCommandHeader(
		buffer: Buffer,
		keyIndex: number,
		partIndex: number,
		isLast: boolean,
		_bodyLength: number
	): void {
		buffer.writeUInt8(0x02, 0)
		buffer.writeUInt8(0x01, 1)
		buffer.writeUInt16LE(partIndex, 2)
		// 3 = 0x00
		buffer.writeUInt8(isLast ? 1 : 0, 4)
		buffer.writeUInt8(keyIndex + 1, 5)
	}
}

export class StreamdeckGen2ImageHeaderGenerator implements StreamdeckImageHeaderGenerator {
	getFillImageCommandHeaderLength(): number {
		return 8
	}

	writeFillImageCommandHeader(
		buffer: Buffer,
		keyIndex: number,
		partIndex: number,
		isLast: boolean,
		bodyLength: number
	): void {
		buffer.writeUInt8(0x02, 0)
		buffer.writeUInt8(0x07, 1)
		buffer.writeUInt8(keyIndex, 2)
		buffer.writeUInt8(isLast ? 1 : 0, 3)
		buffer.writeUInt16LE(bodyLength, 4)
		buffer.writeUInt16LE(partIndex++, 6)
	}
}
