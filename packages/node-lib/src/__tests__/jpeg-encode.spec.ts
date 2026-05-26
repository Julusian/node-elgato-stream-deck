import { encodeJPEG } from '../jpeg.js'
import { readFixtureJSON } from './helpers.js'

const ICON_SIZE = 96

describe('encodeJPEG — end-to-end', () => {
	// Convert the fixture's RGB pixel data (3 bytes/px) to RGBA (4 bytes/px)
	function toRgba(rgb: Buffer): Buffer {
		const pixels = rgb.length / 3
		const rgba = Buffer.alloc(pixels * 4)
		for (let i = 0; i < pixels; i++) {
			rgba.set(rgb.subarray(i * 3, i * 3 + 3), i * 4)
		}
		return rgba
	}

	let rgbaImage: Buffer

	beforeAll(() => {
		rgbaImage = toRgba(readFixtureJSON('fillImage-sample-icon-96.json'))
	})

	test('resolves and returns a non-empty result', async () => {
		const result = await encodeJPEG(rgbaImage, ICON_SIZE, ICON_SIZE, undefined)
		expect(result).toBeInstanceOf(Uint8Array)
		expect(result.length).toBeGreaterThan(0)
	})

	test('output begins with JPEG magic bytes (FF D8 FF)', async () => {
		const result = await encodeJPEG(rgbaImage, ICON_SIZE, ICON_SIZE, undefined)
		expect(result[0]).toBe(0xff)
		expect(result[1]).toBe(0xd8)
		expect(result[2]).toBe(0xff)
	})

	test('lower quality setting produces a smaller JPEG than higher quality', async () => {
		const hi = await encodeJPEG(rgbaImage, ICON_SIZE, ICON_SIZE, { quality: 95 })
		const lo = await encodeJPEG(rgbaImage, ICON_SIZE, ICON_SIZE, { quality: 10 })
		expect(lo.length).toBeLessThan(hi.length)
	})
})
