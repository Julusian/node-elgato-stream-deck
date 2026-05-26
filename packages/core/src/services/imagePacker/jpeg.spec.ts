import { JpegButtonLcdImagePacker } from './jpeg.js'
import type { EncodeJPEGHelper } from '../../models/base.js'

const TARGET_SIZE = { width: 120, height: 120 }

function makeEncodeJpeg(): jest.MockedFunction<EncodeJPEGHelper> {
	return jest.fn(async (buf) => buf) // passthrough
}

describe('JpegButtonLcdImagePacker', () => {
	let encodeJpeg: jest.MockedFunction<EncodeJPEGHelper>

	beforeEach(() => {
		encodeJpeg = makeEncodeJpeg()
	})

	describe('convertPixelBuffer', () => {
		test('calls encodeJPEG with the transformed buffer and correct dimensions', async () => {
			const packer = new JpegButtonLcdImagePacker(encodeJpeg, {})
			const sourceBuffer = new Uint8Array(TARGET_SIZE.width * TARGET_SIZE.height * 3)
			const sourceOptions = { format: 'rgb', offset: 0, stride: TARGET_SIZE.width * 3 }

			await packer.convertPixelBuffer(sourceBuffer, sourceOptions as any, TARGET_SIZE)

			expect(encodeJpeg).toHaveBeenCalledTimes(1)
			expect(encodeJpeg).toHaveBeenCalledWith(expect.any(Uint8Array), TARGET_SIZE.width, TARGET_SIZE.height)
		})

		test('returns whatever encodeJPEG returns', async () => {
			const jpegOutput = new Uint8Array([0xff, 0xd8, 0xff]) // fake JPEG magic
			encodeJpeg.mockResolvedValueOnce(jpegOutput)

			const packer = new JpegButtonLcdImagePacker(encodeJpeg, {})
			const sourceBuffer = new Uint8Array(TARGET_SIZE.width * TARGET_SIZE.height * 3)
			const sourceOptions = { format: 'rgb', offset: 0, stride: TARGET_SIZE.width * 3 }

			const result = await packer.convertPixelBuffer(sourceBuffer, sourceOptions as any, TARGET_SIZE)

			expect(result).toBe(jpegOutput)
		})

		test('passes rgba buffer to encodeJPEG (colorMode is always rgba)', async () => {
			const packer = new JpegButtonLcdImagePacker(encodeJpeg, {})
			const size = { width: 1, height: 1 }
			const sourceBuffer = new Uint8Array([255, 0, 0]) // single red rgb pixel
			const sourceOptions = { format: 'rgb', offset: 0, stride: 3 }

			await packer.convertPixelBuffer(sourceBuffer, sourceOptions as any, size)

			const passedBuffer = encodeJpeg.mock.calls[0][0]
			// After rgba transform of a single red pixel: [255, 0, 0, 255]
			expect(passedBuffer.length).toBe(4) // rgba = 4 bytes per pixel
			expect(passedBuffer[0]).toBe(255) // r
			expect(passedBuffer[1]).toBe(0) // g
			expect(passedBuffer[2]).toBe(0) // b
			expect(passedBuffer[3]).toBe(255) // alpha always 255
		})

		test('xFlip reverses pixel order in the buffer passed to encodeJPEG', async () => {
			const packer = new JpegButtonLcdImagePacker(encodeJpeg, { xFlip: true })
			const size = { width: 2, height: 1 }
			// Two pixels: [red, blue] in rgb
			const sourceBuffer = new Uint8Array([255, 0, 0, 0, 0, 255])
			const sourceOptions = { format: 'rgb', offset: 0, stride: 6 }

			await packer.convertPixelBuffer(sourceBuffer, sourceOptions as any, size)

			const passedBuffer = encodeJpeg.mock.calls[0][0]
			// xFlip: pixel 0 of output = pixel 1 of input = blue → [0, 0, 255, 255] in rgba
			expect(passedBuffer[0]).toBe(0) // r from blue pixel
			expect(passedBuffer[1]).toBe(0) // g
			expect(passedBuffer[2]).toBe(255) // b
		})

		test('yFlip reverses row order in buffer passed to encodeJPEG', async () => {
			const packer = new JpegButtonLcdImagePacker(encodeJpeg, { yFlip: true })
			const size = { width: 1, height: 2 }
			// Row 0 = red, Row 1 = blue
			const sourceBuffer = new Uint8Array([255, 0, 0, 0, 0, 255])
			const sourceOptions = { format: 'rgb', offset: 0, stride: 3 }

			await packer.convertPixelBuffer(sourceBuffer, sourceOptions as any, size)

			const passedBuffer = encodeJpeg.mock.calls[0][0]
			// yFlip: row 0 of output = row 1 of input = blue
			expect(passedBuffer[0]).toBe(0)
			expect(passedBuffer[1]).toBe(0)
			expect(passedBuffer[2]).toBe(255)
		})
	})
})
