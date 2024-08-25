import type { FillImageOptions } from '../../types.js'

export interface InternalFillImageOptions extends FillImageOptions {
	offset: number
	stride: number
}

export interface ButtonLcdImagePacker {
	readonly imageWidth: number
	readonly imageHeight: number

	convertPixelBuffer(sourceBuffer: Uint8Array, sourceOptions: InternalFillImageOptions): Promise<Uint8Array>
}
