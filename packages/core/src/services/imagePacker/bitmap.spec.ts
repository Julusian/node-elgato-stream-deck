import { BitmapButtonLcdImagePacker } from './bitmap.js'
import { BMP_HEADER_LENGTH } from '../../util.js'

const TARGET_SIZE = { width: 72, height: 72 }
const BMP_IMAGE_PPM = 2835

function makePacker(xFlip = false, yFlip = false): BitmapButtonLcdImagePacker {
	return new BitmapButtonLcdImagePacker({ colorMode: 'bgr', xFlip, yFlip }, BMP_IMAGE_PPM)
}

function makeRgbSourceBuffer(width: number, height: number): { buffer: Uint8Array; sourceOptions: any } {
	const buffer = new Uint8Array(width * height * 3)
	// Fill with a simple gradient to detect transformation effects
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 3
			buffer[i] = x // r
			buffer[i + 1] = y // g
			buffer[i + 2] = 0 // b
		}
	}
	return {
		buffer,
		sourceOptions: { format: 'rgb', offset: 0, stride: width * 3 },
	}
}

describe('BitmapButtonLcdImagePacker', () => {
	describe('convertPixelBuffer output structure', () => {
		test('output length is BMP_HEADER_LENGTH + width * height * 3', async () => {
			const packer = makePacker()
			const { buffer, sourceOptions } = makeRgbSourceBuffer(TARGET_SIZE.width, TARGET_SIZE.height)

			const result = await packer.convertPixelBuffer(buffer, sourceOptions, TARGET_SIZE)

			expect(result.length).toBe(BMP_HEADER_LENGTH + TARGET_SIZE.width * TARGET_SIZE.height * 3)
		})

		test('output starts with BMP magic bytes "BM" (0x42, 0x4d)', async () => {
			const packer = makePacker()
			const { buffer, sourceOptions } = makeRgbSourceBuffer(TARGET_SIZE.width, TARGET_SIZE.height)

			const result = await packer.convertPixelBuffer(buffer, sourceOptions, TARGET_SIZE)

			expect(result[0]).toBe(0x42) // 'B'
			expect(result[1]).toBe(0x4d) // 'M'
		})

		test('file size field in BMP header is correct', async () => {
			const packer = makePacker()
			const { buffer, sourceOptions } = makeRgbSourceBuffer(TARGET_SIZE.width, TARGET_SIZE.height)

			const result = await packer.convertPixelBuffer(buffer, sourceOptions, TARGET_SIZE)

			const view = new DataView(result.buffer, result.byteOffset)
			const fileSize = view.getUint32(2, true)
			expect(fileSize).toBe(result.length)
		})

		test('pixel data offset field is 54 (BMP_HEADER_LENGTH)', async () => {
			const packer = makePacker()
			const { buffer, sourceOptions } = makeRgbSourceBuffer(TARGET_SIZE.width, TARGET_SIZE.height)

			const result = await packer.convertPixelBuffer(buffer, sourceOptions, TARGET_SIZE)

			const view = new DataView(result.buffer, result.byteOffset)
			const pixelOffset = view.getUint32(10, true)
			expect(pixelOffset).toBe(54)
		})

		test('PPM is written correctly to horizontal and vertical resolution fields', async () => {
			const ppm = 3780
			const packer = new BitmapButtonLcdImagePacker({ colorMode: 'bgr' }, ppm)
			const { buffer, sourceOptions } = makeRgbSourceBuffer(TARGET_SIZE.width, TARGET_SIZE.height)

			const result = await packer.convertPixelBuffer(buffer, sourceOptions, TARGET_SIZE)

			const view = new DataView(result.buffer, result.byteOffset)
			expect(view.getInt32(38, true)).toBe(ppm) // horizontal resolution
			expect(view.getInt32(42, true)).toBe(ppm) // vertical resolution
		})
	})

	describe('pixel transformation', () => {
		test('BGR color mode swaps red and blue channels relative to RGB source', async () => {
			// Single-pixel buffer for easy verification
			const size = { width: 1, height: 1 }
			const packer = new BitmapButtonLcdImagePacker({ colorMode: 'bgr' }, BMP_IMAGE_PPM)
			const sourceBuffer = new Uint8Array([100, 150, 200]) // rgb
			const sourceOptions = { format: 'rgb', offset: 0, stride: 3 }

			const result = await packer.convertPixelBuffer(sourceBuffer, sourceOptions as any, size)

			// Pixel at offset BMP_HEADER_LENGTH: should be BGR = [200, 150, 100]
			expect(result[BMP_HEADER_LENGTH]).toBe(200) // b
			expect(result[BMP_HEADER_LENGTH + 1]).toBe(150) // g
			expect(result[BMP_HEADER_LENGTH + 2]).toBe(100) // r
		})

		test('yFlip reverses row order', async () => {
			const width = 2
			const height = 2
			const size = { width, height }
			const packer = new BitmapButtonLcdImagePacker({ colorMode: 'bgr', yFlip: true }, BMP_IMAGE_PPM)

			// Row 0: [10, 0, 0, 20, 0, 0], Row 1: [30, 0, 0, 40, 0, 0]
			const sourceBuffer = new Uint8Array([10, 0, 0, 20, 0, 0, 30, 0, 0, 40, 0, 0])
			const sourceOptions = { format: 'rgb', offset: 0, stride: 6 }

			const result = await packer.convertPixelBuffer(sourceBuffer, sourceOptions as any, size)

			// After yFlip, row 0 of output = row 1 of input → first pixel of output should be 30 (or 0 in bgr)
			// Since colorMode='bgr' and source is rgb with b=0, first byte at pixel offset = 0 (b from r=30 → b)
			// Actually: source rgb (r,g,b) = (30,0,0) → bgr = (0,0,30)
			expect(result[BMP_HEADER_LENGTH]).toBe(0) // b from r=30 swap
			expect(result[BMP_HEADER_LENGTH + 2]).toBe(30) // r from b=30... wait, bgr means b=src.b, g=src.g, r=src.r
			// flipColours = (src format 'rgb' != target 'bgr') = true → swap r and b
			// pixel (30, 0, 0) rgb → target bgr with flip = (0, 0, 30): buf[0]=b=0, buf[1]=g=0, buf[2]=r=30
			expect(result[BMP_HEADER_LENGTH + 2]).toBe(30)
		})
	})
})
