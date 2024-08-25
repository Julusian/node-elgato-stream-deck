import type { StreamDeckButtonControlDefinition } from '../../controlDefinition.js'
import type { HIDDevice } from '../../hid-device.js'
import type { Dimension, KeyIndex } from '../../id.js'
import type { StreamDeckProperties } from '../../models/base.js'
import type { FillPanelDimensionsOptions, FillImageOptions, FillPanelOptions } from '../../types.js'
import type { StreamdeckImageWriter } from '../imageWriter/types.js'
import type { ButtonsLcdDisplayService, GridSpan } from './interface.js'
import type { ButtonLcdImagePacker, InternalFillImageOptions } from '../imagePacker/interface.js'

export class DefaultButtonsLcdService implements ButtonsLcdDisplayService {
	readonly #imageWriter: StreamdeckImageWriter
	readonly #imagePacker: ButtonLcdImagePacker
	readonly #device: HIDDevice
	readonly #deviceProperties: Readonly<StreamDeckProperties>

	constructor(
		imageWriter: StreamdeckImageWriter,
		imagePacker: ButtonLcdImagePacker,
		device: HIDDevice,
		deviceProperties: Readonly<StreamDeckProperties>,
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

	private getLcdButtonControls(): StreamDeckButtonControlDefinition[] {
		return this.#deviceProperties.CONTROLS.filter(
			(control): control is StreamDeckButtonControlDefinition =>
				control.type === 'button' && control.feedbackType === 'lcd',
		)
	}

	private calculateLcdGridSpan(buttonsLcd: StreamDeckButtonControlDefinition[]): GridSpan | null {
		if (buttonsLcd.length === 0) return null

		const allRowValues = buttonsLcd.map((button) => button.row)
		const allColumnValues = buttonsLcd.map((button) => button.column)

		return {
			minRow: Math.min(...allRowValues),
			maxRow: Math.max(...allRowValues),
			minCol: Math.min(...allColumnValues),
			maxCol: Math.max(...allColumnValues),
		}
	}

	private calculateDimensionsFromGridSpan(gridSpan: GridSpan, withPadding: boolean | undefined): Dimension {
		if (withPadding) {
			// TODO: Implement padding
			throw new Error('Not implemented')
		} else {
			const rowCount = gridSpan.maxRow - gridSpan.minRow + 1
			const columnCount = gridSpan.maxCol - gridSpan.minCol + 1

			return {
				width: columnCount * this.#imagePacker.imageWidth,
				height: rowCount * this.#imagePacker.imageHeight,
			}
		}
	}

	public calculateFillPanelDimensions(options: FillPanelDimensionsOptions | undefined): Dimension | null {
		const buttonLcdControls = this.getLcdButtonControls()
		const gridSpan = this.calculateLcdGridSpan(buttonLcdControls)

		if (!gridSpan) return null

		return this.calculateDimensionsFromGridSpan(gridSpan, options?.withPadding)
	}

	public async clearPanel(): Promise<void> {
		const ps: Promise<void>[] = []

		for (const control of this.#deviceProperties.CONTROLS) {
			if (control.type !== 'button') continue

			switch (control.feedbackType) {
				case 'rgb':
					ps.push(this.sendKeyRgb(control.hidIndex, 0, 0, 0))
					break
				case 'lcd':
					if (this.#deviceProperties.SUPPORTS_RGB_KEY_FILL) {
						ps.push(this.sendKeyRgb(control.hidIndex, 0, 0, 0))
					} else {
						const pixels = new Uint8Array(this.imageRgbBytes)
						ps.push(
							this.fillImageRangeControl(control, pixels, {
								format: 'rgb',
								offset: 0,
								stride: this.#imagePacker.imageWidth * 3,
							}),
						)
					}

					break
				case 'none':
					// Do nothing
					break
			}
		}

		await Promise.all(ps)
	}

	public async clearKey(keyIndex: KeyIndex): Promise<void> {
		const control = this.#deviceProperties.CONTROLS.find(
			(control): control is StreamDeckButtonControlDefinition =>
				control.type === 'button' && control.index === keyIndex,
		)

		if (this.#deviceProperties.SUPPORTS_RGB_KEY_FILL || control?.feedbackType === 'rgb') {
			await this.sendKeyRgb(keyIndex, 0, 0, 0)
		} else {
			const pixels = new Uint8Array(this.imageRgbBytes)
			await this.fillImageRange(keyIndex, pixels, {
				format: 'rgb',
				offset: 0,
				stride: this.#imagePacker.imageWidth * 3,
			})
		}
	}

	public async fillKeyColor(keyIndex: KeyIndex, r: number, g: number, b: number): Promise<void> {
		this.checkRGBValue(r)
		this.checkRGBValue(g)
		this.checkRGBValue(b)

		const control = this.#deviceProperties.CONTROLS.find(
			(control): control is StreamDeckButtonControlDefinition =>
				control.type === 'button' && control.index === keyIndex,
		)

		if (this.#deviceProperties.SUPPORTS_RGB_KEY_FILL || control?.feedbackType === 'rgb') {
			await this.sendKeyRgb(keyIndex, r, g, b)
		} else {
			// rgba is excessive here, but it makes the fill easier as it can be done in a 32bit uint
			const pixels = new Uint8Array(this.imagePixelCount * 4)
			const view = new DataView(pixels.buffer, pixels.byteOffset, pixels.byteLength)

			// write first pixel
			view.setUint8(0, r)
			view.setUint8(1, g)
			view.setUint8(2, b)
			view.setUint8(3, 255)

			// read computed pixel
			const sample = view.getUint32(0)
			// fill with computed pixel
			for (let i = 1; i < this.imagePixelCount; i++) {
				view.setUint32(i * 4, sample)
			}

			await this.fillImageRange(keyIndex, pixels, {
				format: 'rgba',
				offset: 0,
				stride: this.#imagePacker.imageWidth * 3,
			})
		}
	}

	public async fillKeyBuffer(keyIndex: KeyIndex, imageBuffer: Uint8Array, options?: FillImageOptions): Promise<void> {
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

	public async fillPanelBuffer(imageBuffer: Uint8Array, options?: FillPanelOptions): Promise<void> {
		const sourceFormat = options?.format ?? 'rgb'
		this.checkSourceFormat(sourceFormat)

		const buttonLcdControls = this.getLcdButtonControls()
		const panelGridSpan = this.calculateLcdGridSpan(buttonLcdControls)

		if (!panelGridSpan) {
			throw new Error(`Panel does not support being filled`)
		}

		const panelDimensions = this.calculateDimensionsFromGridSpan(panelGridSpan, options?.withPadding)

		const expectedByteCount = sourceFormat.length * panelDimensions.width * panelDimensions.height
		if (imageBuffer.length !== expectedByteCount) {
			throw new RangeError(
				`Expected image buffer of length ${expectedByteCount}, got length ${imageBuffer.length}`,
			)
		}

		const iconSize = this.#imagePacker.imageWidth * sourceFormat.length
		const stride = panelDimensions.width * sourceFormat.length

		const ps: Array<Promise<void>> = []
		for (const control of buttonLcdControls) {
			const controlRow = control.row - panelGridSpan.minRow
			const controlCol = control.column - panelGridSpan.minCol

			const rowOffset = stride * controlRow * this.#imagePacker.imageHeight
			const colOffset = controlCol * iconSize

			// TODO: Implement padding
			ps.push(
				this.fillImageRangeControl(control, imageBuffer, {
					format: sourceFormat,
					offset: rowOffset + colOffset,
					stride,
				}),
			)
		}
		await Promise.all(ps)
	}

	private async sendKeyRgb(keyIndex: number, red: number, green: number, blue: number): Promise<void> {
		await this.#device.sendFeatureReport(new Uint8Array([0x03, 0x06, keyIndex, red, green, blue]))
	}

	private async fillImageRange(keyIndex: KeyIndex, imageBuffer: Uint8Array, sourceOptions: InternalFillImageOptions) {
		const buttonControl = this.#deviceProperties.CONTROLS.find(
			(control): control is StreamDeckButtonControlDefinition =>
				control.type === 'button' && control.index === keyIndex,
		)
		if (!buttonControl) throw new TypeError(`Expected a valid keyIndex`)
		return this.fillImageRangeControl(buttonControl, imageBuffer, sourceOptions)
	}

	private async fillImageRangeControl(
		buttonControl: StreamDeckButtonControlDefinition,
		imageBuffer: Uint8Array,
		sourceOptions: InternalFillImageOptions,
	) {
		if (buttonControl.feedbackType !== 'lcd')
			throw new TypeError(`keyIndex ${buttonControl.index} does not support lcd feedback`)

		const byteBuffer = await this.#imagePacker.convertPixelBuffer(imageBuffer, sourceOptions)

		const packets = this.#imageWriter.generateFillImageWrites({ keyIndex: buttonControl.hidIndex }, byteBuffer)
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
