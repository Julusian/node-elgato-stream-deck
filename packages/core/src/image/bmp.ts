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
