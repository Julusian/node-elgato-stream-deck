import * as jpegJS from 'jpeg-js'

export interface JPEGEncodeOptions {
	quality: number
	subsampling?: number
}

const DEFAULT_QUALITY = 95

/**
 * The default JPEG encoder.
 * `@julusian/jpeg-turbo` will be used if it can be found, otherwise it will fall back to `jpeg-js`
 * @param buffer The buffer to convert
 * @param width Width of the image
 * @param height Hieght of the image
 */
export async function encodeJPEG(
	buffer: Buffer,
	width: number,
	height: number,
	options: JPEGEncodeOptions | undefined,
): Promise<Buffer> {
	try {
		const jpegTurbo = await import('@julusian/jpeg-turbo')

		// Try using jpeg-turbo if it is available
		if (jpegTurbo && jpegTurbo.bufferSize && !!jpegTurbo.compressSync) {
			const encodeOptions: import('@julusian/jpeg-turbo').EncodeOptions = {
				format: jpegTurbo.FORMAT_RGBA,
				width,
				height,
				quality: DEFAULT_QUALITY,
				...options,
			}
			if (buffer.length === width * height * 4) {
				const tmpBuffer = Buffer.alloc(jpegTurbo.bufferSize(encodeOptions))
				return jpegTurbo.compress(buffer, tmpBuffer, encodeOptions)
			}
		}
	} catch (_e) {
		// TODO - log error
	}

	// If jpeg-turbo is unavailable or fails, then fallback to jpeg-js
	const jpegBuffer2 = jpegJS.encode(
		{
			width,
			height,
			data: buffer,
		},
		options ? options.quality : DEFAULT_QUALITY,
	)
	return jpegBuffer2.data
}
