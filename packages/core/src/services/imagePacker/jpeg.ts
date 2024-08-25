import { ButtonLcdImagePacker, InternalFillImageOptions } from './interface.js'
import { transformImageBuffer } from '../../util.js'
import { EncodeJPEGHelper } from '../../models/base.js'

export class JpegButtonLcdImagePacker implements ButtonLcdImagePacker {
	readonly #encodeJPEG: EncodeJPEGHelper
	readonly #xyFlip: boolean
	readonly #imageWidth: number
	readonly #imageHeight: number

	constructor(encodeJPEG: EncodeJPEGHelper, xyFlip: boolean, imageWidth: number, imageHeight: number) {
		this.#encodeJPEG = encodeJPEG
		this.#xyFlip = xyFlip
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
			{ colorMode: 'rgba', xFlip: this.#xyFlip, yFlip: this.#xyFlip },
			0,
			this.#imageWidth,
			this.#imageHeight,
		)

		return this.#encodeJPEG(byteBuffer, this.#imageWidth, this.#imageHeight)
	}
}
