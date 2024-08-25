import type { ButtonLcdImagePacker, InternalFillImageOptions } from './interface.js'
import { transformImageBuffer } from '../../util.js'
import type { EncodeJPEGHelper } from '../../models/base.js'
import type { Dimension } from '../../id.js'

export class JpegButtonLcdImagePacker implements ButtonLcdImagePacker {
	readonly #encodeJPEG: EncodeJPEGHelper
	readonly #xyFlip: boolean

	constructor(encodeJPEG: EncodeJPEGHelper, xyFlip: boolean) {
		this.#encodeJPEG = encodeJPEG
		this.#xyFlip = xyFlip
	}

	// get imageWidth(): number {
	// 	return this.#imageWidth
	// }

	// get imageHeight(): number {
	// 	return this.#imageHeight
	// }

	public async convertPixelBuffer(
		sourceBuffer: Uint8Array,
		sourceOptions: InternalFillImageOptions,
		targetSize: Dimension,
	): Promise<Uint8Array> {
		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions,
			{ colorMode: 'rgba', xFlip: this.#xyFlip, yFlip: this.#xyFlip },
			0,
			targetSize.width,
			targetSize.height,
		)

		return this.#encodeJPEG(byteBuffer, targetSize.width, targetSize.height)
	}
}
