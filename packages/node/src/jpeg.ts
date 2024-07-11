import * as jpegJS from 'jpeg-js'

let jpegTurbo: typeof import('@julusian/jpeg-turbo') | undefined
try {
	// eslint-disable-next-line node/no-extraneous-require
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	jpegTurbo = require('@julusian/jpeg-turbo')
} catch (e) {
	// This is expected and can be ignored
}

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
	buffer: Uint8Array,
	width: number,
	height: number,
	options: JPEGEncodeOptions | undefined
): Promise<Uint8Array> {
	try {
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
				return jpegTurbo.compress(Buffer.from(buffer.buffer), tmpBuffer, encodeOptions)
			}
		}
	} catch (e) {
		// TODO - log error
		jpegTurbo = undefined
	}

	// If jpeg-turbo is unavailable or fails, then fallback to jpeg-js
	const jpegBuffer2 = jpegJS.encode(
		{
			width,
			height,
			data: buffer,
		},
		options ? options.quality : DEFAULT_QUALITY
	)
	return Promise.resolve(jpegBuffer2.data)
}
