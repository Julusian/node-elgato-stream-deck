import type { Dimension } from '../../id.js'
import type { FillImageOptions } from '../../types.js'
import type { StreamDeckButtonHidPadding } from '../../controlDefinition.js'

export interface InternalFillImageOptions extends FillImageOptions {
	offset: number
	stride: number
}

export interface ButtonLcdImagePacker {
	convertPixelBuffer(
		sourceBuffer: Uint8Array | Uint8ClampedArray,
		sourceOptions: InternalFillImageOptions,
		targetSize: Dimension,
		/** Black border added around the image, making the output larger than targetSize */
		padding: StreamDeckButtonHidPadding | undefined,
	): Promise<Uint8Array>
}
