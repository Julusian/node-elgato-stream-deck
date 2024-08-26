import type { Dimension } from '../../id.js'
import type { FillImageOptions } from '../../types.js'

export interface InternalFillImageOptions extends FillImageOptions {
	offset: number
	stride: number
}

export interface ButtonLcdImagePacker {
	convertPixelBuffer(
		sourceBuffer: Uint8Array,
		sourceOptions: InternalFillImageOptions,
		targetSize: Dimension,
	): Promise<Uint8Array>
}
