export function bufferToIntArray(buffer: Buffer): number[] {
	const array: number[] = []
	for (const pair of buffer.entries()) {
		array.push(pair[1])
	}
	return array
}

export function numberArrayToString(array: number[]): string {
	const end = array.indexOf(0)
	if (end !== -1) {
		array = array.slice(0, end)
	}

	return array.map(val => String.fromCharCode(val)).join('')
}

export function imageToByteArray(
	imageBuffer: Buffer,
	sourceOffset: number,
	sourceStride: number,
	transformCoordinates: (x: number, y: number) => { x: number; y: number },
	colorMode: 'bgr' | 'rgba',
	imageSize: number
) {
	const byteBuffer = Buffer.alloc(imageSize * imageSize * colorMode.length)

	for (let y = 0; y < imageSize; y++) {
		const rowBytes: number[] = []
		for (let x = 0; x < imageSize; x++) {
			const { x: x2, y: y2 } = transformCoordinates(x, y)
			const i = y2 * sourceStride + sourceOffset + x2 * 3

			const red = imageBuffer.readUInt8(i)
			const green = imageBuffer.readUInt8(i + 1)
			const blue = imageBuffer.readUInt8(i + 2)

			if (colorMode === 'bgr') {
				rowBytes.push(blue, green, red)
			} else {
				rowBytes.push(red, green, blue, 255)
			}
		}

		byteBuffer.set(rowBytes, imageSize * colorMode.length * y)
	}

	return byteBuffer
}

export function buildBMPHeader(iconSize: number, iconBytes: number, imagePPM: number): Buffer {
	// Uses header format BITMAPINFOHEADER https://en.wikipedia.org/wiki/BMP_file_format
	const buf = Buffer.alloc(54)

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

	return buf
}

export function buildFillImageCommandHeader(keyIndex: number, partIndex: number, isLast: boolean) {
	// prettier-ignore
	return [
		0x02, 0x01, partIndex, 0x00, isLast ? 0x01 : 0x00, keyIndex + 1, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
	]
}
