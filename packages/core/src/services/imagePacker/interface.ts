import type { Dimension } from '../../id.js'
import type { FillImageOptions } from '../../types.js'

export interface InternalFillImageOptions extends FillImageOptions {
	offset: number
	stride: number
}

export interface ButtonLcdImagePacker {
	// readonly imageWidth: number
	// readonly imageHeight: number

	convertPixelBuffer(
		sourceBuffer: Uint8Array,
		sourceOptions: InternalFillImageOptions,
		targetSize: Dimension,
	): Promise<Uint8Array>
}
