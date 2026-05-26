import { StreamdeckOriginalImageWriter, StreamdeckDefaultImageWriter } from './imageWriter.js'
import { StreamdeckGen2ImageHeaderGenerator } from './headerGenerator.js'

describe('StreamdeckOriginalImageWriter', () => {
	const writer = new StreamdeckOriginalImageWriter()

	test('always produces exactly 2 packets', () => {
		const payload = new Uint8Array(200)
		const result = writer.generateFillImageWrites({ keyIndex: 0 }, payload)
		expect(result).toHaveLength(2)
	})

	test('each packet is 8191 bytes', () => {
		const payload = new Uint8Array(200)
		const result = writer.generateFillImageWrites({ keyIndex: 3 }, payload)
		expect(result[0].length).toBe(8191)
		expect(result[1].length).toBe(8191)
	})

	test('packet 1 header: byte 0 = 0x02, byte 1 = 0x01, partIndex = 0x01 (LE), isLast = 0, keyIndex+1', () => {
		const payload = new Uint8Array(100)
		const result = writer.generateFillImageWrites({ keyIndex: 4 }, payload)
		const view = new DataView(result[0].buffer)

		expect(result[0][0]).toBe(0x02)
		expect(result[0][1]).toBe(0x01)
		expect(view.getUint16(2, true)).toBe(1) // partIndex
		expect(result[0][4]).toBe(0) // not last
		expect(result[0][5]).toBe(5) // keyIndex + 1
	})

	test('packet 2 header: partIndex = 0x02, isLast = 1', () => {
		const payload = new Uint8Array(100)
		const result = writer.generateFillImageWrites({ keyIndex: 0 }, payload)
		const view = new DataView(result[1].buffer)

		expect(view.getUint16(2, true)).toBe(2) // partIndex
		expect(result[1][4]).toBe(1) // isLast
	})

	test('payload is split equally across the two packets (header at offset 0-15)', () => {
		const HEADER_LENGTH = 16
		const payload = new Uint8Array(200)
		for (let i = 0; i < 200; i++) payload[i] = i // unique values

		const result = writer.generateFillImageWrites({ keyIndex: 0 }, payload)

		const half = 100 // 200 / 2
		// Packet 1: payload[0..99] at offset 16
		expect(result[0].slice(HEADER_LENGTH, HEADER_LENGTH + half)).toEqual(payload.slice(0, half))
		// Packet 2: payload[100..199] at offset 16
		expect(result[1].slice(HEADER_LENGTH, HEADER_LENGTH + half)).toEqual(payload.slice(half))
	})
})

describe('StreamdeckDefaultImageWriter', () => {
	const HEADER_LENGTH = 8 // Gen2 header length
	const MAX_PAYLOAD = 1024 - HEADER_LENGTH // 1016 bytes

	function makeWriter() {
		return new StreamdeckDefaultImageWriter(new StreamdeckGen2ImageHeaderGenerator())
	}

	test('single packet when payload fits within MAX_PAYLOAD_SIZE', () => {
		const writer = makeWriter()
		const payload = new Uint8Array(100)
		const result = writer.generateFillImageWrites({ keyIndex: 0 }, payload)
		expect(result).toHaveLength(1)
	})

	test('each packet is exactly 1024 bytes', () => {
		const writer = makeWriter()
		const payload = new Uint8Array(MAX_PAYLOAD * 3)
		const result = writer.generateFillImageWrites({ keyIndex: 0 }, payload)
		for (const pkt of result) {
			expect(pkt.length).toBe(1024)
		}
	})

	test('multiple packets when payload exceeds MAX_PAYLOAD_SIZE', () => {
		const writer = makeWriter()
		const payload = new Uint8Array(MAX_PAYLOAD + 1)
		const result = writer.generateFillImageWrites({ keyIndex: 0 }, payload)
		expect(result).toHaveLength(2)
	})

	test('correct number of packets for large payload', () => {
		const writer = makeWriter()
		const threeChunks = MAX_PAYLOAD * 3
		const payload = new Uint8Array(threeChunks)
		const result = writer.generateFillImageWrites({ keyIndex: 0 }, payload)
		expect(result).toHaveLength(3)
	})

	test('only the last packet has isLast = 1', () => {
		const writer = makeWriter()
		const payload = new Uint8Array(MAX_PAYLOAD * 2)
		const result = writer.generateFillImageWrites({ keyIndex: 0 }, payload)

		expect(result[0][3]).toBe(0) // not last
		expect(result[1][3]).toBe(1) // last
	})

	test('part index increments correctly', () => {
		const writer = makeWriter()
		const payload = new Uint8Array(MAX_PAYLOAD * 3)
		const result = writer.generateFillImageWrites({ keyIndex: 0 }, payload)
		const view0 = new DataView(result[0].buffer)
		const view1 = new DataView(result[1].buffer)
		const view2 = new DataView(result[2].buffer)

		expect(view0.getUint16(6, true)).toBe(0)
		expect(view1.getUint16(6, true)).toBe(1)
		expect(view2.getUint16(6, true)).toBe(2)
	})

	test('payload is correctly chunked across packets', () => {
		const writer = makeWriter()
		const payload = new Uint8Array(MAX_PAYLOAD * 2)
		for (let i = 0; i < payload.length; i++) payload[i] = i & 0xff

		const result = writer.generateFillImageWrites({ keyIndex: 0 }, payload)

		// First packet: payload[0..MAX_PAYLOAD-1] at offset HEADER_LENGTH
		expect(Array.from(result[0].slice(HEADER_LENGTH, HEADER_LENGTH + MAX_PAYLOAD))).toEqual(
			Array.from(payload.slice(0, MAX_PAYLOAD)),
		)

		// Second packet: payload[MAX_PAYLOAD..end] at offset HEADER_LENGTH
		expect(Array.from(result[1].slice(HEADER_LENGTH, HEADER_LENGTH + MAX_PAYLOAD))).toEqual(
			Array.from(payload.slice(MAX_PAYLOAD)),
		)
	})

	test('bodyLength in header matches bytes written to that packet', () => {
		const writer = makeWriter()
		// Payload that doesn't fill the last packet evenly
		const payload = new Uint8Array(MAX_PAYLOAD + 100)
		const result = writer.generateFillImageWrites({ keyIndex: 0 }, payload)

		const view0 = new DataView(result[0].buffer)
		const view1 = new DataView(result[1].buffer)

		expect(view0.getUint16(4, true)).toBe(MAX_PAYLOAD)
		expect(view1.getUint16(4, true)).toBe(100)
	})
})
