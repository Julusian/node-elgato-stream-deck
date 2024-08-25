import { StreamdeckGen1ImageHeaderGenerator } from './headerGenerator.js'
import { StreamdeckImageHeaderGenerator, StreamdeckImageWriter, StreamdeckImageWriterProps } from './types.js'

export class StreamdeckOriginalImageWriter implements StreamdeckImageWriter {
	private readonly headerGenerator = new StreamdeckGen1ImageHeaderGenerator()

	public generateFillImageWrites(props: StreamdeckImageWriterProps, byteBuffer: Buffer): Buffer[] {
		const MAX_PACKET_SIZE = 8191
		const PACKET_HEADER_LENGTH = this.headerGenerator.getFillImageCommandHeaderLength()

		// The original uses larger packets, and splits the payload equally across 2

		const packet1Bytes = byteBuffer.length / 2

		const packet1 = Buffer.alloc(MAX_PACKET_SIZE)
		this.headerGenerator.writeFillImageCommandHeader(packet1, props, 0x01, false, packet1Bytes)
		byteBuffer.copy(packet1, PACKET_HEADER_LENGTH, 0, packet1Bytes)

		const packet2 = Buffer.alloc(MAX_PACKET_SIZE)
		this.headerGenerator.writeFillImageCommandHeader(packet2, props, 0x02, true, packet1Bytes)
		byteBuffer.copy(packet2, PACKET_HEADER_LENGTH, packet1Bytes)

		return [packet1, packet2]
	}
}

export class StreamdeckDefaultImageWriter<TProps = StreamdeckImageWriterProps>
	implements StreamdeckImageWriter<TProps>
{
	private readonly headerGenerator: StreamdeckImageHeaderGenerator<TProps>

	constructor(headerGenerator: StreamdeckImageHeaderGenerator<TProps>) {
		this.headerGenerator = headerGenerator
	}

	public generateFillImageWrites(props: TProps, byteBuffer: Buffer): Buffer[] {
		const MAX_PACKET_SIZE = 1024
		const PACKET_HEADER_LENGTH = this.headerGenerator.getFillImageCommandHeaderLength()
		const MAX_PAYLOAD_SIZE = MAX_PACKET_SIZE - PACKET_HEADER_LENGTH

		const result: Buffer[] = []

		let remainingBytes = byteBuffer.length
		for (let part = 0; remainingBytes > 0; part++) {
			const packet = Buffer.alloc(MAX_PACKET_SIZE)

			const byteCount = Math.min(remainingBytes, MAX_PAYLOAD_SIZE)
			this.headerGenerator.writeFillImageCommandHeader(
				packet,
				props,
				part,
				remainingBytes <= MAX_PAYLOAD_SIZE,
				byteCount,
			)

			const byteOffset = byteBuffer.length - remainingBytes
			remainingBytes -= byteCount
			byteBuffer.copy(packet, PACKET_HEADER_LENGTH, byteOffset, byteOffset + byteCount)

			result.push(packet)
		}

		return result
	}
}
