import type { ButtonLcdImagePacker, InternalFillImageOptions } from './interface.js'
import type { FillImageTargetOptions } from '../../util.js'
import { paddedImageSize, transformImageBuffer, BMP_HEADER_LENGTH, writeBMPHeader } from '../../util.js'
import type { Dimension } from '../../id.js'
import type { StreamDeckButtonHidPadding } from '../../controlDefinition.js'

export class BitmapButtonLcdImagePacker implements ButtonLcdImagePacker {
	readonly #targetOptions: FillImageTargetOptions
	readonly #bmpImagePPM: number

	constructor(targetOptions: FillImageTargetOptions, bmpImagePPM: number) {
		this.#targetOptions = targetOptions
		this.#bmpImagePPM = bmpImagePPM
	}

	public async convertPixelBuffer(
		sourceBuffer: Uint8Array,
		sourceOptions: InternalFillImageOptions,
		targetSize: Dimension,
		padding: StreamDeckButtonHidPadding | undefined,
	): Promise<Uint8Array> {
		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions,
			this.#targetOptions,
			BMP_HEADER_LENGTH,
			targetSize.width,
			targetSize.height,
			padding,
		)
		const outputSize = paddedImageSize(targetSize, padding)
		writeBMPHeader(
			byteBuffer,
			outputSize.width,
			outputSize.height,
			byteBuffer.length - BMP_HEADER_LENGTH,
			this.#bmpImagePPM,
		)
		return byteBuffer
	}
}
