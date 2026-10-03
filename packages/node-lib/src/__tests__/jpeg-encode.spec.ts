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

	/** Read the sampling factor byte of each component from the JPEG's start-of-frame header */
	function getSamplingFactors(jpeg: Uint8Array): number[] {
		for (let i = 2; i < jpeg.length - 1;) {
			if (jpeg[i] !== 0xff) throw new Error('Invalid JPEG marker')
			const marker = jpeg[i + 1]
			const length = (jpeg[i + 2] << 8) | jpeg[i + 3]
			if (marker >= 0xc0 && marker <= 0xc2) {
				const componentCount = jpeg[i + 9]
				const factors: number[] = []
				for (let c = 0; c < componentCount; c++) factors.push(jpeg[i + 11 + c * 3])
				return factors
			}
			i += 2 + length
		}
		throw new Error('No start-of-frame marker')
	}

	test('defaults to 4:4:4 chroma subsampling', async () => {
		const result = await encodeJPEG(rgbaImage, ICON_SIZE, ICON_SIZE, undefined)
		expect(getSamplingFactors(result)).toEqual([0x11, 0x11, 0x11])
	})

	test('subsampling can be overridden', async () => {
		const jpegTurbo = await import('@julusian/jpeg-turbo')
		const result = await encodeJPEG(rgbaImage, ICON_SIZE, ICON_SIZE, {
			quality: 95,
			subsampling: jpegTurbo.SAMP_420,
		})
		expect(getSamplingFactors(result)).toEqual([0x22, 0x11, 0x11])
	})

	test('lower quality setting produces a smaller JPEG than higher quality', async () => {
		const hi = await encodeJPEG(rgbaImage, ICON_SIZE, ICON_SIZE, { quality: 95 })
		const lo = await encodeJPEG(rgbaImage, ICON_SIZE, ICON_SIZE, { quality: 10 })
		expect(lo.length).toBeLessThan(hi.length)
	})
})
