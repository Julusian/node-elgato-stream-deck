export function numberArrayToString(array: number[]): string {
	const end = array.indexOf(0)
	if (end !== -1) {
		array = array.slice(0, end)
	}

	return array.map((val) => String.fromCharCode(val)).join('')
}

export function imageToByteArray(
	imageBuffer: Buffer,
	sourceOffset: number,
	sourceStride: number,
	destOffset: number,
	transformCoordinates: (x: number, y: number) => { x: number; y: number },
	colorMode: 'bgr' | 'rgba',
	imageSize: number
): Buffer {
	const byteBuffer = Buffer.alloc(destOffset + imageSize * imageSize * colorMode.length)

	for (let y = 0; y < imageSize; y++) {
		const rowOffset = destOffset + imageSize * colorMode.length * y
		for (let x = 0; x < imageSize; x++) {
			const { x: x2, y: y2 } = transformCoordinates(x, y)
			const i = y2 * sourceStride + sourceOffset + x2 * 3

			const red = imageBuffer.readUInt8(i)
			const green = imageBuffer.readUInt8(i + 1)
			const blue = imageBuffer.readUInt8(i + 2)

			const offset = rowOffset + x * colorMode.length
			if (colorMode === 'bgr') {
				byteBuffer.writeUInt8(blue, offset)
				byteBuffer.writeUInt8(green, offset + 1)
				byteBuffer.writeUInt8(red, offset + 2)
			} else {
				byteBuffer.writeUInt8(red, offset)
				byteBuffer.writeUInt8(green, offset + 1)
				byteBuffer.writeUInt8(blue, offset + 2)
				byteBuffer.writeUInt8(255, offset + 3)
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
