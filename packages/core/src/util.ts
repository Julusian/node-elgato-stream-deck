import type { InternalFillImageOptions } from './services/imagePacker/interface.js'
import type { Dimension } from './id.js'
import type { StreamDeckButtonHidPadding } from './controlDefinition.js'

export interface FillImageTargetOptions {
	colorMode: 'bgr' | 'rgba'
	xFlip?: boolean
	yFlip?: boolean
	rotate?: boolean
}

/** The size of an image once padding has been added around it */
export function paddedImageSize(size: Dimension, padding: StreamDeckButtonHidPadding | undefined): Dimension {
	if (!padding) return size
	return {
		width: size.width + padding.left + padding.right,
		height: size.height + padding.top + padding.bottom,
	}
}

export function transformImageBuffer(
	imageBuffer: Uint8Array | Uint8ClampedArray,
	sourceOptions: InternalFillImageOptions,
	targetOptions: FillImageTargetOptions,
	destPadding: number,
	imageWidth: number,
	imageHeight: number,
	imagePadding: StreamDeckButtonHidPadding | undefined,
): Uint8Array {
	const imageBufferView = uint8ArrayToDataView(imageBuffer)

	// The output includes any padding, which gets filled with black
	const padLeft = imagePadding?.left ?? 0
	const padTop = imagePadding?.top ?? 0
	const fullSize = paddedImageSize({ width: imageWidth, height: imageHeight }, imagePadding)

	const targetWidth = targetOptions.rotate ? fullSize.height : fullSize.width
	const targetHeight = targetOptions.rotate ? fullSize.width : fullSize.height

	const byteBuffer = new Uint8Array(destPadding + targetWidth * targetHeight * targetOptions.colorMode.length)
	const byteBufferView = uint8ArrayToDataView(byteBuffer)

	const flipColours = sourceOptions.format.substring(0, 3) !== targetOptions.colorMode.substring(0, 3)

	for (let y = 0; y < targetHeight; y++) {
		const rowOffset = destPadding + targetWidth * targetOptions.colorMode.length * y
		for (let x = 0; x < targetWidth; x++) {
			// Apply x/y flips
			let x2 = targetOptions.xFlip ? targetWidth - x - 1 : x
			let y2 = targetOptions.yFlip ? targetHeight - y - 1 : y

			if (targetOptions.rotate) {
				// Swap x and y
				const tmpX = x2
				x2 = y2
				y2 = tmpX
			}

			const targetOffset = rowOffset + x * targetOptions.colorMode.length
			if (targetOptions.colorMode.length === 4) {
				byteBufferView.setUint8(targetOffset + 3, 255)
			}

			// Move into the source image, leaving the padding black
			x2 -= padLeft
			y2 -= padTop
			if (x2 < 0 || y2 < 0 || x2 >= imageWidth || y2 >= imageHeight) continue

			const srcOffset = y2 * sourceOptions.stride + sourceOptions.offset + x2 * sourceOptions.format.length

			const red = imageBufferView.getUint8(srcOffset)
			const green = imageBufferView.getUint8(srcOffset + 1)
			const blue = imageBufferView.getUint8(srcOffset + 2)

			if (flipColours) {
				byteBufferView.setUint8(targetOffset, blue)
				byteBufferView.setUint8(targetOffset + 1, green)
				byteBufferView.setUint8(targetOffset + 2, red)
			} else {
				byteBufferView.setUint8(targetOffset, red)
				byteBufferView.setUint8(targetOffset + 1, green)
				byteBufferView.setUint8(targetOffset + 2, blue)
			}
		}
	}

	return byteBuffer
}

export const BMP_HEADER_LENGTH = 54
export function writeBMPHeader(
	buf: Uint8Array,
	imageWidth: number,
	imageHeight: number,
	imageBytes: number,
	imagePPM: number,
): void {
	const bufView = uint8ArrayToDataView(buf)
	// Uses header format BITMAPINFOHEADER https://en.wikipedia.org/wiki/BMP_file_format

	// Bitmap file header
	bufView.setUint8(0, 0x42) // B
	bufView.setUint8(1, 0x4d) // M
	bufView.setUint32(2, imageBytes + 54, true)
	bufView.setInt16(6, 0, true)
	bufView.setInt16(8, 0, true)
	bufView.setUint32(10, 54, true) // Full header size

	// DIB header (BITMAPINFOHEADER)
	bufView.setUint32(14, 40, true) // DIB header size
	bufView.setInt32(18, imageWidth, true)
	bufView.setInt32(22, imageHeight, true)
	bufView.setInt16(26, 1, true) // Color planes
	bufView.setInt16(28, 24, true) // Bit depth
	bufView.setInt32(30, 0, true) // Compression
	bufView.setInt32(34, imageBytes, true) // Image size
	bufView.setInt32(38, imagePPM, true) // Horizontal resolution ppm
	bufView.setInt32(42, imagePPM, true) // Vertical resolution ppm
	bufView.setInt32(46, 0, true) // Colour pallette size
	bufView.setInt32(50, 0, true) // 'Important' Colour count
}

export function uint8ArrayToDataView(buffer: Uint8Array | Uint8ClampedArray): DataView {
	return new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
}
