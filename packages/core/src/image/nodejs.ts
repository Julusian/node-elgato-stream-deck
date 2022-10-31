import { InternalFillImageOptions } from '../models/base'
import { FillImageTargetOptions } from '../image/options'

export function jsImageToByteArray(
	imageBuffer: Buffer,
	sourceOptions: InternalFillImageOptions,
	targetOptions: FillImageTargetOptions,
	destPadding: number,
	imageSize: number
): Buffer {
	const byteBuffer = Buffer.alloc(destPadding + imageSize * imageSize * targetOptions.colorMode.length)

	const flipColours = sourceOptions.format.substring(0, 3) !== targetOptions.colorMode.substring(0, 3)

	for (let y = 0; y < imageSize; y++) {
		const rowOffset = destPadding + imageSize * targetOptions.colorMode.length * y
		for (let x = 0; x < imageSize; x++) {
			// Apply x/y flips
			let x2 = targetOptions.xFlip ? imageSize - x - 1 : x
			let y2 = targetOptions.yFlip ? imageSize - y - 1 : y

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
