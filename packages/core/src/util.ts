import { uint8ArrayToDataView } from './util'
import { InternalFillImageOptions } from './models/base'

export interface FillImageTargetOptions {
	colorMode: 'bgr' | 'rgba'
	xFlip?: boolean
	yFlip?: boolean
	rotate?: boolean
}

export function transformImageBuffer(
	imageBuffer: Uint8Array,
	sourceOptions: InternalFillImageOptions,
	targetOptions: FillImageTargetOptions,
	destPadding: number,
	imageWidth: number,
	imageHeight?: number
): Uint8Array {
	if (!imageHeight) imageHeight = imageWidth

	const imageBufferView = uint8ArrayToDataView(imageBuffer)

	const byteBuffer = new Uint8Array(destPadding + imageWidth * imageHeight * targetOptions.colorMode.length)
	const byteBufferView = uint8ArrayToDataView(byteBuffer)

	const flipColours = sourceOptions.format.substring(0, 3) !== targetOptions.colorMode.substring(0, 3)

	for (let y = 0; y < imageHeight; y++) {
		const rowOffset = destPadding + imageWidth * targetOptions.colorMode.length * y
		for (let x = 0; x < imageWidth; x++) {
			// Apply x/y flips
			let x2 = targetOptions.xFlip ? imageWidth - x - 1 : x
			let y2 = targetOptions.yFlip ? imageHeight - y - 1 : y

			if (targetOptions.rotate) {
				// Swap x and y
				const tmpX = x2
				x2 = y2
				y2 = tmpX
			}

			const srcOffset = y2 * sourceOptions.stride + sourceOptions.offset + x2 * sourceOptions.format.length

			const red = imageBufferView.getUint8(srcOffset)
			const green = imageBufferView.getUint8(srcOffset + 1)
			const blue = imageBufferView.getUint8(srcOffset + 2)

			const targetOffset = rowOffset + x * targetOptions.colorMode.length
			if (flipColours) {
				byteBufferView.setUint8(targetOffset, blue)
				byteBufferView.setUint8(targetOffset + 1, green)
				byteBufferView.setUint8(targetOffset + 2, red)
			} else {
				byteBufferView.setUint8(targetOffset, red)
				byteBufferView.setUint8(targetOffset + 1, green)
				byteBufferView.setUint8(targetOffset + 2, blue)
			}
			if (targetOptions.colorMode.length === 4) {
				byteBufferView.setUint8(targetOffset + 3, 255)
			}
		}
	}

	return byteBuffer
}

export const BMP_HEADER_LENGTH = 54
export function writeBMPHeader(buf: Uint8Array, iconSize: number, iconBytes: number, imagePPM: number): void {
	const bufView = uint8ArrayToDataView(buf)
	// Uses header format BITMAPINFOHEADER https://en.wikipedia.org/wiki/BMP_file_format

	// Bitmap file header
	bufView.setUint8(0, 0x42) // B
	bufView.setUint8(1, 0x4d) // M
	bufView.setUint32(2, iconBytes + 54, true)
	bufView.setInt16(6, 0, true)
	bufView.setInt16(8, 0, true)
	bufView.setUint32(10, 54, true) // Full header size

	// DIB header (BITMAPINFOHEADER)
	bufView.setUint32(14, 40, true) // DIB header size
	bufView.setInt32(18, iconSize, true)
	bufView.setInt32(22, iconSize, true)
	bufView.setInt16(26, 1, true) // Color planes
	bufView.setInt16(28, 24, true) // Bit depth
	bufView.setInt32(30, 0, true) // Compression
	bufView.setInt32(34, iconBytes, true) // Image size
	bufView.setInt32(38, imagePPM, true) // Horizontal resolution ppm
	bufView.setInt32(42, imagePPM, true) // Vertical resolution ppm
	bufView.setInt32(46, 0, true) // Colour pallette size
	bufView.setInt32(50, 0, true) // 'Important' Colour count
}

export function uint8ArrayToDataView(buffer: Uint8Array): DataView {
	return new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
}
