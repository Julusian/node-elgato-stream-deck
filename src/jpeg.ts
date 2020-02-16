import * as jpegJS from 'jpeg-js'

let jpegTurbo: typeof import('@julusian/jpeg-turbo') | undefined
try {
	// tslint:disable-next-line: no-var-requires
	jpegTurbo = require('@julusian/jpeg-turbo')
} catch (e) {
	// This is expected and can be ignored
}

export interface JPEGEncodeOptions {
	quality: number
	subsampling?: number
}

const DEFAULT_QUALITY = 95

export function encodeJPEG(buffer: Buffer, width: number, height: number, options: JPEGEncodeOptions | undefined) {
	try {
		// Try using jpeg-turbo if it is available
		if (jpegTurbo && jpegTurbo.bufferSize && jpegTurbo.compressSync) {
			const encodeOptions: import('@julusian/jpeg-turbo').EncodeOptions = {
				format: jpegTurbo.FORMAT_RGBA,
				width,
				height,
				quality: DEFAULT_QUALITY,
				...options
			}
			if (buffer.length === width * height * 4) {
				const tmpBuffer = Buffer.alloc(jpegTurbo.bufferSize(encodeOptions))
				return jpegTurbo.compressSync(buffer, tmpBuffer, encodeOptions)
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
			data: buffer
		},
		options ? options.quality : DEFAULT_QUALITY
	)
	return jpegBuffer2.data
}
