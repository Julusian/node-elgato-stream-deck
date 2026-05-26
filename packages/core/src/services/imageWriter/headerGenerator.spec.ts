import {
	StreamdeckGen1ImageHeaderGenerator,
	StreamdeckGen2ImageHeaderGenerator,
	StreamdeckDefaultLcdImageHeaderGenerator,
	StreamdeckNeoLcdImageHeaderGenerator,
} from './headerGenerator.js'

describe('StreamdeckGen1ImageHeaderGenerator', () => {
	const gen = new StreamdeckGen1ImageHeaderGenerator()

	test('header length is 16', () => {
		expect(gen.getFillImageCommandHeaderLength()).toBe(16)
	})

	test('writes correct bytes to header buffer', () => {
		const buffer = new Uint8Array(16)
		gen.writeFillImageCommandHeader(buffer, { keyIndex: 4 }, 3, true, 0)

		expect(buffer[0]).toBe(0x02)
		expect(buffer[1]).toBe(0x01)
		// partIndex uint16LE = 3
		const view = new DataView(buffer.buffer)
		expect(view.getUint16(2, true)).toBe(3)
		// isLast
		expect(buffer[4]).toBe(1)
		// keyIndex + 1
		expect(buffer[5]).toBe(5)
	})

	test('isLast false writes 0', () => {
		const buffer = new Uint8Array(16)
		gen.writeFillImageCommandHeader(buffer, { keyIndex: 0 }, 1, false, 0)
		expect(buffer[4]).toBe(0)
	})

	test('keyIndex is written as keyIndex+1', () => {
		const buffer = new Uint8Array(16)
		gen.writeFillImageCommandHeader(buffer, { keyIndex: 0 }, 0, false, 0)
		expect(buffer[5]).toBe(1)

		gen.writeFillImageCommandHeader(buffer, { keyIndex: 14 }, 0, false, 0)
		expect(buffer[5]).toBe(15)
	})
})

describe('StreamdeckGen2ImageHeaderGenerator', () => {
	const gen = new StreamdeckGen2ImageHeaderGenerator()

	test('header length is 8', () => {
		expect(gen.getFillImageCommandHeaderLength()).toBe(8)
	})

	test('writes correct bytes to header buffer', () => {
		const buffer = new Uint8Array(8)
		const view = new DataView(buffer.buffer)
		gen.writeFillImageCommandHeader(buffer, { keyIndex: 7 }, 2, true, 512)

		expect(buffer[0]).toBe(0x02)
		expect(buffer[1]).toBe(0x07)
		expect(buffer[2]).toBe(7) // keyIndex
		expect(buffer[3]).toBe(1) // isLast
		expect(view.getUint16(4, true)).toBe(512) // bodyLength
		expect(view.getUint16(6, true)).toBe(2) // partIndex
	})

	test('isLast false writes 0', () => {
		const buffer = new Uint8Array(8)
		gen.writeFillImageCommandHeader(buffer, { keyIndex: 0 }, 0, false, 100)
		expect(buffer[3]).toBe(0)
	})
})

describe('StreamdeckDefaultLcdImageHeaderGenerator', () => {
	const gen = new StreamdeckDefaultLcdImageHeaderGenerator()

	test('header length is 16', () => {
		expect(gen.getFillImageCommandHeaderLength()).toBe(16)
	})

	test('writes correct bytes for LCD fill command', () => {
		const buffer = new Uint8Array(16)
		const view = new DataView(buffer.buffer)
		gen.writeFillImageCommandHeader(buffer, { x: 100, y: 50, width: 200, height: 80, keyIndex: 0 }, 5, true, 1024)

		expect(buffer[0]).toBe(0x02)
		expect(buffer[1]).toBe(0x0c)
		expect(view.getUint16(2, true)).toBe(100) // x
		expect(view.getUint16(4, true)).toBe(50) // y
		expect(view.getUint16(6, true)).toBe(200) // width
		expect(view.getUint16(8, true)).toBe(80) // height
		expect(buffer[10]).toBe(1) // isLast
		expect(view.getUint16(11, true)).toBe(5) // partIndex
		expect(view.getUint16(13, true)).toBe(1024) // bodyLength
	})

	test('isLast false writes 0', () => {
		const buffer = new Uint8Array(16)
		gen.writeFillImageCommandHeader(buffer, { x: 0, y: 0, width: 10, height: 10, keyIndex: 0 }, 0, false, 0)
		expect(buffer[10]).toBe(0)
	})
})

describe('StreamdeckNeoLcdImageHeaderGenerator', () => {
	const gen = new StreamdeckNeoLcdImageHeaderGenerator()

	test('header length is 8', () => {
		expect(gen.getFillImageCommandHeaderLength()).toBe(8)
	})

	test('writes correct bytes to header buffer', () => {
		const buffer = new Uint8Array(8)
		const view = new DataView(buffer.buffer)
		gen.writeFillImageCommandHeader(buffer, null as any, 3, true, 900)

		expect(buffer[0]).toBe(0x02)
		expect(buffer[1]).toBe(0x0b)
		expect(buffer[2]).toBe(0)
		expect(buffer[3]).toBe(1) // isLast
		expect(view.getUint16(4, true)).toBe(900) // bodyLength
		expect(view.getUint16(6, true)).toBe(3) // partIndex
	})

	test('isLast false writes 0', () => {
		const buffer = new Uint8Array(8)
		gen.writeFillImageCommandHeader(buffer, null as any, 0, false, 0)
		expect(buffer[3]).toBe(0)
	})
})
