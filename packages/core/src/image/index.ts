import { jsImageToByteArray } from './nodejs'
import { InternalFillImageOptions } from '../models/base'
import { FillImageTargetOptions } from './options'

export * from './bmp'
export * from './options'

// let wasmAppearsOk = true

export function imageToByteArray(
	imageBuffer: Buffer,
	sourceOptions: InternalFillImageOptions,
	targetOptions: FillImageTargetOptions,
	destPadding: number,
	imageSize: number
): Buffer {
	// try {
	// 	if (wasmAppearsOk) {
	// 		wasmImageToByteArray
	// 	}
	// } catch (e) {
	// 	wasmAppearsOk = false
	// }
	return jsImageToByteArray(imageBuffer, sourceOptions, targetOptions, destPadding, imageSize)
	//
}
