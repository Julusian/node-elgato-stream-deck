import type { KeyIndex } from '../id'

export interface StreamdeckImageWriter {
	generateFillImageWrites(keyIndex: KeyIndex, byteBuffer: Buffer): Buffer[]
}

export interface StreamdeckImageHeaderGenerator {
	getFillImageCommandHeaderLength(): number
	writeFillImageCommandHeader(
		buffer: Buffer,
		keyIndex: number,
		partIndex: number,
		isLast: boolean,
		bodyLength: number
	): void
}
