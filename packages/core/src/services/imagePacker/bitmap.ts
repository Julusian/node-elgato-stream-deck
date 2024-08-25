import type { ButtonLcdImagePacker, InternalFillImageOptions } from './interface.js'
import type { FillImageTargetOptions } from '../../util.js'
import { transformImageBuffer, BMP_HEADER_LENGTH, writeBMPHeader } from '../../util.js'

export class BitmapButtonLcdImagePacker implements ButtonLcdImagePacker {
	readonly #targetOptions: FillImageTargetOptions
	readonly #bmpImagePPM: number
	readonly #imageWidth: number
	readonly #imageHeight: number

	constructor(targetOptions: FillImageTargetOptions, bmpImagePPM: number, imageWidth: number, imageHeight: number) {
		this.#targetOptions = targetOptions
		this.#bmpImagePPM = bmpImagePPM
		this.#imageWidth = imageWidth
		this.#imageHeight = imageHeight
	}

	get imageWidth(): number {
		return this.#imageWidth
	}

	get imageHeight(): number {
		return this.#imageHeight
	}

	public async convertPixelBuffer(
		sourceBuffer: Uint8Array,
		sourceOptions: InternalFillImageOptions,
	): Promise<Uint8Array> {
		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions,
			this.#targetOptions,
			BMP_HEADER_LENGTH,
			this.#imageWidth,
			this.#imageHeight,
		)
		writeBMPHeader(
			byteBuffer,
			this.#imageWidth,
			this.#imageHeight,
			byteBuffer.length - BMP_HEADER_LENGTH,
			this.#bmpImagePPM,
		)
		return byteBuffer
	}
}
