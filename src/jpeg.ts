import * as jpegJS from 'jpeg-js'

let jpegTurbo: typeof import('jpeg-turbo') | undefined
import('jpeg-turbo')
	.then(mod => {
		jpegTurbo = mod
	})
	.catch(() => {
		// This is expected and can be ignored
	})

export function encodeJPEG(buffer: Buffer, width: number, height: number) {
	try {
		// Try using jpeg-turbo if it is available
		if (jpegTurbo) {
			const options = {
				format: jpegTurbo.FORMAT_RGBA,
				width,
				height,
				quality: 95
			}
			const tmpBuffer = Buffer.alloc(jpegTurbo.bufferSize(options))
			return jpegTurbo.compressSync(buffer, tmpBuffer, options)
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
