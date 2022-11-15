import type { KeyIndex } from '../id'

export interface StreamdeckImageWriterProps {
	keyIndex: KeyIndex
}

export interface StreamdeckImageWriter<TProps = StreamdeckImageWriterProps> {
	generateFillImageWrites(props: TProps, byteBuffer: Uint8Array): Uint8Array[]
}

export interface StreamdeckImageHeaderGenerator<TProps = StreamdeckImageWriterProps> {
	getFillImageCommandHeaderLength(): number
	writeFillImageCommandHeader(
		buffer: Uint8Array,
		props: TProps,
		partIndex: number,
		isLast: boolean,
		bodyLength: number
	): void
}
