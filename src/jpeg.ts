import * as jpegJS from 'jpeg-js'

let jpegTurbo: typeof import('@julusian/jpeg-turbo') | undefined
try {
	// tslint:disable-next-line: no-var-requires
	jpegTurbo = require('@julusian/jpeg-turbo')
} catch (e) {
	// This is expected and can be ignored
}

export function encodeJPEG(buffer: Buffer, width: number, height: number) {
	try {
		// Try using jpeg-turbo if it is available
		if (jpegTurbo && jpegTurbo.bufferSize && jpegTurbo.compressSync) {
			const options = {
				format: jpegTurbo.FORMAT_RGBA,
				width,
				height,
				quality: 95
			}
			if (buffer.length === width * height * 4) {
				const tmpBuffer = Buffer.alloc(jpegTurbo.bufferSize(options))
				return jpegTurbo.compressSync(buffer, tmpBuffer, options)
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
		95
	)
	return jpegBuffer2.data
}
