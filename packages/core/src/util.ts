import { InternalFillImageOptions } from './models/base'

export interface FillImageTargetOptions {
	colorMode: 'bgr' | 'rgba'
	xFlip?: boolean
	yFlip?: boolean
	rotate?: boolean
}

export function imageToByteArray(
	imageBuffer: Buffer,
	sourceOptions: InternalFillImageOptions,
	targetOptions: FillImageTargetOptions,
	destPadding: number,
	imageWidth: number,
	imageHeight?: number
): Buffer {
	if (!imageHeight) imageHeight = imageWidth

	const byteBuffer = Buffer.alloc(destPadding + imageWidth * imageHeight * targetOptions.colorMode.length)

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

			const red = imageBuffer.readUInt8(srcOffset)
			const green = imageBuffer.readUInt8(srcOffset + 1)
			const blue = imageBuffer.readUInt8(srcOffset + 2)

			const targetOffset = rowOffset + x * targetOptions.colorMode.length
			if (flipColours) {
				byteBuffer.writeUInt8(blue, targetOffset)
				byteBuffer.writeUInt8(green, targetOffset + 1)
				byteBuffer.writeUInt8(red, targetOffset + 2)
			} else {
				byteBuffer.writeUInt8(red, targetOffset)
				byteBuffer.writeUInt8(green, targetOffset + 1)
				byteBuffer.writeUInt8(blue, targetOffset + 2)
			}
			if (targetOptions.colorMode.length === 4) {
				byteBuffer.writeUInt8(255, targetOffset + 3)
			}
		}
	}

	return byteBuffer
}

export const BMP_HEADER_LENGTH = 54
export function writeBMPHeader(buf: Buffer, iconSize: number, iconBytes: number, imagePPM: number): void {
	// Uses header format BITMAPINFOHEADER https://en.wikipedia.org/wiki/BMP_file_format

	// Bitmap file header
	buf.write('BM')
	buf.writeUInt32LE(iconBytes + 54, 2)
	buf.writeInt16LE(0, 6)
	buf.writeInt16LE(0, 8)
	buf.writeUInt32LE(54, 10) // Full header size

	// DIB header (BITMAPINFOHEADER)
	buf.writeUInt32LE(40, 14) // DIB header size
	buf.writeInt32LE(iconSize, 18)
	buf.writeInt32LE(iconSize, 22)
	buf.writeInt16LE(1, 26) // Color planes
	buf.writeInt16LE(24, 28) // Bit depth
	buf.writeInt32LE(0, 30) // Compression
	buf.writeInt32LE(iconBytes, 34) // Image size
	buf.writeInt32LE(imagePPM, 38) // Horizontal resolution ppm
	buf.writeInt32LE(imagePPM, 42) // Vertical resolution ppm
	buf.writeInt32LE(0, 46) // Colour pallette size
	buf.writeInt32LE(0, 50) // 'Important' Colour count
}
