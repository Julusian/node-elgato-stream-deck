import type { ButtonLcdImagePacker, InternalFillImageOptions } from './interface.js'
import type { FillImageTargetOptions } from '../../util.js'
import { transformImageBuffer } from '../../util.js'
import type { EncodeJPEGHelper } from '../../models/base.js'
import type { Dimension } from '../../id.js'

export type JpegPackerTransformOptions = Omit<FillImageTargetOptions, 'colorMode'>

export class JpegButtonLcdImagePacker implements ButtonLcdImagePacker {
	readonly #encodeJPEG: EncodeJPEGHelper
	readonly #transform: JpegPackerTransformOptions

	constructor(encodeJPEG: EncodeJPEGHelper, transform: JpegPackerTransformOptions) {
		this.#encodeJPEG = encodeJPEG
		this.#transform = transform
	}

	public async convertPixelBuffer(
		sourceBuffer: Uint8Array,
		sourceOptions: InternalFillImageOptions,
		targetSize: Dimension,
	): Promise<Uint8Array> {
		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions,
			{ ...this.#transform, colorMode: 'rgba' },
			0,
			targetSize.width,
			targetSize.height,
		)

		return this.#encodeJPEG(byteBuffer, targetSize.width, targetSize.height)
	}
}
