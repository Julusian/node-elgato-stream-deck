import type { KeyIndex } from '../../id'

export interface StreamdeckImageWriterProps {
	keyIndex: KeyIndex
}

export interface StreamdeckImageWriter<TProps = StreamdeckImageWriterProps> {
	generateFillImageWrites(props: TProps, byteBuffer: Buffer): Buffer[]
}

export interface StreamdeckImageHeaderGenerator<TProps = StreamdeckImageWriterProps> {
	getFillImageCommandHeaderLength(): number
	writeFillImageCommandHeader(
		buffer: Buffer,
		props: TProps,
		partIndex: number,
		isLast: boolean,
		bodyLength: number
	): void
}
