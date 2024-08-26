import { StreamdeckGen1ImageHeaderGenerator } from './headerGenerator.js'
import type { StreamdeckImageHeaderGenerator, StreamdeckImageWriter, StreamdeckImageWriterProps } from './types.js'

export class StreamdeckOriginalImageWriter implements StreamdeckImageWriter {
	private readonly headerGenerator = new StreamdeckGen1ImageHeaderGenerator()

	public generateFillImageWrites(props: StreamdeckImageWriterProps, byteBuffer: Uint8Array): Uint8Array[] {
		const MAX_PACKET_SIZE = 8191
		const PACKET_HEADER_LENGTH = this.headerGenerator.getFillImageCommandHeaderLength()

		// The original uses larger packets, and splits the payload equally across 2

		const packet1Bytes = byteBuffer.length / 2

		const packet1 = new Uint8Array(MAX_PACKET_SIZE)
		this.headerGenerator.writeFillImageCommandHeader(packet1, props, 0x01, false, packet1Bytes)
		packet1.set(byteBuffer.subarray(0, packet1Bytes), PACKET_HEADER_LENGTH)

		const packet2 = new Uint8Array(MAX_PACKET_SIZE)
		this.headerGenerator.writeFillImageCommandHeader(packet2, props, 0x02, true, packet1Bytes)
		packet2.set(byteBuffer.subarray(packet1Bytes), PACKET_HEADER_LENGTH)

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

	public generateFillImageWrites(props: TProps, byteBuffer: Uint8Array): Uint8Array[] {
		const MAX_PACKET_SIZE = 1024
		const PACKET_HEADER_LENGTH = this.headerGenerator.getFillImageCommandHeaderLength()
		const MAX_PAYLOAD_SIZE = MAX_PACKET_SIZE - PACKET_HEADER_LENGTH

		const result: Uint8Array[] = []

		let remainingBytes = byteBuffer.length
		for (let part = 0; remainingBytes > 0; part++) {
			const packet = new Uint8Array(MAX_PACKET_SIZE)

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
			packet.set(byteBuffer.subarray(byteOffset, byteOffset + byteCount), PACKET_HEADER_LENGTH)

			result.push(packet)
		}

		return result
	}
}
