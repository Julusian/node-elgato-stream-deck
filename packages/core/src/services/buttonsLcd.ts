import type { StreamDeckProperties } from '../models/base'
import type { HIDDevice } from '../hid-device'
import type { KeyIndex } from '../id'
import type { FillImageOptions, FillPanelOptions } from '../types'
import type { StreamdeckImageWriter } from './imageWriter/types'
import { transformKeyIndex } from '../util'

export interface InternalFillImageOptions extends FillImageOptions {
	offset: number
	stride: number
}

export interface ButtonLcdImagePacker {
	readonly imageWidth: number
	readonly imageHeight: number

	convertFillImage(sourceBuffer: Buffer, sourceOptions: InternalFillImageOptions): Promise<Buffer>
}

export class ButtonsLcdService {
	readonly #imageWriter: StreamdeckImageWriter
	readonly #imagePacker: ButtonLcdImagePacker
	readonly #device: HIDDevice
	readonly #deviceProperties: Readonly<StreamDeckProperties>

	constructor(
		imageWriter: StreamdeckImageWriter,
		imagePacker: ButtonLcdImagePacker,
		device: HIDDevice,
		deviceProperties: Readonly<StreamDeckProperties>
	) {
		this.#imageWriter = imageWriter
		this.#imagePacker = imagePacker
		this.#device = device
		this.#deviceProperties = deviceProperties
	}

	private get imagePixelCount(): number {
		return this.#imagePacker.imageWidth * this.#imagePacker.imageHeight
	}
	private get imageRgbBytes(): number {
		return this.imagePixelCount * 3
	}

	/** @deprecated */
	private get keyCount(): number {
		return this.#deviceProperties.COLUMNS * this.#deviceProperties.ROWS
	}

	public async clearPanel(): Promise<void> {
		const ps: Promise<void>[] = []

		if (this.#deviceProperties.SUPPORTS_RGB_KEY_FILL) {
			for (let keyIndex = 0; keyIndex < this.keyCount; keyIndex++) {
				ps.push(this.sendKeyRgb(keyIndex, 0, 0, 0))
			}
		} else if (this.imagePixelCount > 0) {
			const pixels = Buffer.alloc(this.imageRgbBytes, 0)
			for (let keyIndex = 0; keyIndex < this.keyCount; keyIndex++) {
				ps.push(
					this.fillImageRange(keyIndex, pixels, {
						format: 'rgb',
						offset: 0,
						stride: this.#imagePacker.imageWidth * 3,
					})
				)
			}
		}

		await Promise.all(ps)
	}

	public async fillKeyColor(keyIndex: KeyIndex, r: number, g: number, b: number): Promise<void> {
		this.checkRGBValue(r)
		this.checkRGBValue(g)
		this.checkRGBValue(b)

		if (this.#deviceProperties.SUPPORTS_RGB_KEY_FILL || keyIndex >= this.keyCount) {
			await this.sendKeyRgb(keyIndex, r, g, b)
		} else {
			const pixels = Buffer.alloc(this.imageRgbBytes, Buffer.from([r, g, b]))
			await this.fillImageRange(keyIndex, pixels, {
				format: 'rgb',
				offset: 0,
				stride: this.#imagePacker.imageWidth * 3,
			})
		}
	}

	public async fillKeyBuffer(keyIndex: KeyIndex, imageBuffer: Buffer, options?: FillImageOptions): Promise<void> {
		const sourceFormat = options?.format ?? 'rgb'
		this.checkSourceFormat(sourceFormat)

		const imageSize = this.imagePixelCount * sourceFormat.length
		if (imageBuffer.length !== imageSize) {
			throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`)
		}

		await this.fillImageRange(keyIndex, imageBuffer, {
			format: sourceFormat,
			offset: 0,
			stride: this.#imagePacker.imageWidth * sourceFormat.length,
		})
	}

	public async fillPanelBuffer(imageBuffer: Buffer, options?: FillPanelOptions): Promise<void> {
		const sourceFormat = options?.format ?? 'rgb'
		this.checkSourceFormat(sourceFormat)

		const imageSize = this.imagePixelCount * sourceFormat.length * this.keyCount
		if (imageBuffer.length !== imageSize) {
			throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`)
		}

		const iconSize = this.#imagePacker.imageWidth * sourceFormat.length
		const stride = iconSize * this.#deviceProperties.COLUMNS

		const ps: Array<Promise<void>> = []
		for (let row = 0; row < this.#deviceProperties.ROWS; row++) {
			const rowOffset = stride * row * this.#imagePacker.imageHeight

			for (let column = 0; column < this.#deviceProperties.COLUMNS; column++) {
				const index = row * this.#deviceProperties.COLUMNS + column
				const colOffset = column * iconSize

				ps.push(
					this.fillImageRange(index, imageBuffer, {
						format: sourceFormat,
						offset: rowOffset + colOffset,
						stride,
					})
				)
			}
		}
		await Promise.all(ps)
	}

	private async sendKeyRgb(keyIndex: number, red: number, green: number, blue: number): Promise<void> {
		await this.#device.sendFeatureReport(Buffer.from([0x03, 0x06, keyIndex, red, green, blue]))
	}

	public async clearKey(keyIndex: KeyIndex): Promise<void> {
		if (this.#deviceProperties.SUPPORTS_RGB_KEY_FILL || keyIndex >= this.keyCount) {
			await this.sendKeyRgb(keyIndex, 0, 0, 0)
		} else {
			const pixels = Buffer.alloc(this.imageRgbBytes, 0)
			await this.fillImageRange(keyIndex, pixels, {
				format: 'rgb',
				offset: 0,
				stride: this.#imagePacker.imageWidth * 3,
			})
		}
	}

	private async fillImageRange(keyIndex: KeyIndex, imageBuffer: Buffer, sourceOptions: InternalFillImageOptions) {
		// this.checkValidKeyIndex(keyIndex) // TODO - do we want this?

		const keyIndexTransformed = transformKeyIndex(this.#deviceProperties, keyIndex)

		const byteBuffer = await this.#imagePacker.convertFillImage(imageBuffer, sourceOptions)

		const packets = this.#imageWriter.generateFillImageWrites({ keyIndex: keyIndexTransformed }, byteBuffer)
		await this.#device.sendReports(packets)
	}

	private checkRGBValue(value: number): void {
		if (value < 0 || value > 255) {
			throw new TypeError('Expected a valid color RGB value 0 - 255')
		}
	}

	private checkSourceFormat(format: 'rgb' | 'rgba' | 'bgr' | 'bgra'): void {
		switch (format) {
			case 'rgb':
			case 'rgba':
			case 'bgr':
			case 'bgra':
				break
			default: {
				const fmt: never = format
				throw new TypeError(`Expected a known color format not "${fmt as string}"`)
			}
		}
	}
}
