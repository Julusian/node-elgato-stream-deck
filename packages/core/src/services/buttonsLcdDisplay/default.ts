import type {
	StreamDeckButtonControlDefinition,
	StreamDeckButtonControlDefinitionLcdFeedback,
} from '../../controlDefinition.js'
import type { HIDDevice } from '../../hid-device.js'
import type { Dimension, KeyIndex } from '../../id.js'
import type { StreamDeckProperties } from '../../models/base.js'
import type { FillPanelDimensionsOptions, FillImageOptions, FillPanelOptions } from '../../types.js'
import type { StreamdeckImageWriter } from '../imageWriter/types.js'
import type { ButtonsLcdDisplayService, GridSpan } from './interface.js'
import type { ButtonLcdImagePacker, InternalFillImageOptions } from '../imagePacker/interface.js'
import { wrapBufferToPreparedBuffer, type PreparedBuffer } from '../../preparedBuffer.js'
import { PendingWriteTracker } from '../pendingWrites.js'

/** Writes to the whole panel overlap every key, so must be sent in order with them */
const PANEL_WRITE_KEY = 'panel'
function keyWriteKey(hidIndex: number): string {
	return `key:${hidIndex}`
}

interface CheckedPanelFill {
	sourceFormat: FillPanelOptions['format']
	buttonLcdControls: StreamDeckButtonControlDefinitionLcdFeedback[]
	panelGridSpan: GridSpan
	stride: number
}

export class DefaultButtonsLcdService implements ButtonsLcdDisplayService {
	readonly #imageWriter: StreamdeckImageWriter
	readonly #imagePacker: ButtonLcdImagePacker
	readonly #device: Pick<HIDDevice, 'sendReports' | 'sendFeatureReport'>
	readonly #deviceProperties: Readonly<StreamDeckProperties>
	readonly #pendingWrites = new PendingWriteTracker()

	constructor(
		imageWriter: StreamdeckImageWriter,
		imagePacker: ButtonLcdImagePacker,
		device: Pick<HIDDevice, 'sendReports' | 'sendFeatureReport'>,
		deviceProperties: Readonly<StreamDeckProperties>,
	) {
		this.#imageWriter = imageWriter
		this.#imagePacker = imagePacker
		this.#device = device
		this.#deviceProperties = deviceProperties
	}

	private getLcdButtonControls(): StreamDeckButtonControlDefinitionLcdFeedback[] {
		return this.#deviceProperties.controls.filter(
			(control): control is StreamDeckButtonControlDefinitionLcdFeedback =>
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

	private calculateDimensionsFromGridSpan(
		gridSpan: GridSpan,
		buttonPixelSize: Dimension,
		withPadding: boolean | undefined,
	): Dimension {
		if (withPadding) {
			// TODO: Implement padding
			throw new Error('Not implemented')
		} else {
			const rowCount = gridSpan.maxRow - gridSpan.minRow + 1
			const columnCount = gridSpan.maxCol - gridSpan.minCol + 1

			// TODO: Consider that different rows/columns could have different dimensions

			return {
				width: columnCount * buttonPixelSize.width,
				height: rowCount * buttonPixelSize.height,
			}
		}
	}

	public calculateFillPanelDimensions(options: FillPanelDimensionsOptions | undefined): Dimension | null {
		const buttonLcdControls = this.getLcdButtonControls()
		const gridSpan = this.calculateLcdGridSpan(buttonLcdControls)

		if (!gridSpan || buttonLcdControls.length === 0) return null

		return this.calculateDimensionsFromGridSpan(gridSpan, buttonLcdControls[0].pixelSize, options?.withPadding)
	}

	public async clearPanel(signal: AbortSignal | null): Promise<boolean> {
		const ps: Promise<boolean>[] = []

		if (this.#deviceProperties.fullscreenPanels > 0) {
			// TODO - should this be a separate property?
			for (let screenIndex = 0; screenIndex < this.#deviceProperties.fullscreenPanels; screenIndex++) {
				ps.push(
					this.#pendingWrites.run(
						`screen:${screenIndex}`,
						signal,
						async (ctx) =>
							ctx.commit(async (writeSignal) =>
								this.#device.sendFeatureReport(
									new Uint8Array([0x03, 0x05, screenIndex, 0, 0, 0]),
									writeSignal,
								),
							),
						// The screen covers the keys, so must be cleared after any pending writes to them
						[PANEL_WRITE_KEY, ...this.getAllKeyWriteKeys()],
					),
				)
			}
			// TODO - clear rgb?
		} else {
			for (const control of this.#deviceProperties.controls) {
				if (control.type !== 'button') continue

				switch (control.feedbackType) {
					case 'rgb':
						ps.push(this.sendKeyRgb(control.hidIndex, 0, 0, 0, signal))
						break
					case 'lcd':
						if (this.#deviceProperties.supportsRgbKeyFill) {
							ps.push(this.sendKeyRgb(control.hidIndex, 0, 0, 0, signal))
						} else {
							const pixels = new Uint8Array(control.pixelSize.width * control.pixelSize.height * 3)
							// TODO - caching?
							ps.push(
								this.fillImageRangeControl(
									control,
									pixels,
									{
										format: 'rgb',
										offset: 0,
										stride: control.pixelSize.width * 3,
									},
									signal,
								),
							)
						}

						break
					case 'none':
						// Do nothing
						break
				}
			}
		}

		const results = await Promise.all(ps)
		return results.every(Boolean)
	}

	public async clearKey(keyIndex: KeyIndex, signal: AbortSignal | null): Promise<boolean> {
		const control = this.#deviceProperties.controls.find(
			(control): control is StreamDeckButtonControlDefinition =>
				control.type === 'button' && control.index === keyIndex,
		)
		if (!control || control.feedbackType === 'none') throw new TypeError(`Expected a valid keyIndex`)

		if (this.#deviceProperties.supportsRgbKeyFill || control.feedbackType === 'rgb') {
			return this.sendKeyRgb(control.hidIndex, 0, 0, 0, signal)
		} else {
			const pixels = new Uint8Array(control.pixelSize.width * control.pixelSize.height * 3)
			// TODO - caching?
			return this.fillImageRangeControl(
				control,
				pixels,
				{
					format: 'rgb',
					offset: 0,
					stride: control.pixelSize.width * 3,
				},
				signal,
			)
		}
	}

	public async fillKeyColor(
		keyIndex: KeyIndex,
		r: number,
		g: number,
		b: number,
		signal: AbortSignal | null,
	): Promise<boolean> {
		this.checkRGBValue(r)
		this.checkRGBValue(g)
		this.checkRGBValue(b)

		const control = this.#deviceProperties.controls.find(
			(control): control is StreamDeckButtonControlDefinition =>
				control.type === 'button' && control.index === keyIndex,
		)
		if (!control || control.feedbackType === 'none') throw new TypeError(`Expected a valid keyIndex`)

		if (this.#deviceProperties.supportsRgbKeyFill || control.feedbackType === 'rgb') {
			return this.sendKeyRgb(control.hidIndex, r, g, b, signal)
		} else {
			// rgba is excessive here, but it makes the fill easier as it can be done in a 32bit uint
			const pixelCount = control.pixelSize.width * control.pixelSize.height
			const pixels = new Uint8Array(pixelCount * 4)
			const view = new DataView(pixels.buffer, pixels.byteOffset, pixels.byteLength)

			// write first pixel
			view.setUint8(0, r)
			view.setUint8(1, g)
			view.setUint8(2, b)
			view.setUint8(3, 255)

			// read computed pixel
			const sample = view.getUint32(0)
			// fill with computed pixel
			for (let i = 1; i < pixelCount; i++) {
				view.setUint32(i * 4, sample)
			}

			return this.fillImageRangeControl(
				control,
				pixels,
				{
					format: 'rgba',
					offset: 0,
					stride: control.pixelSize.width * 4,
				},
				signal,
			)
		}
	}

	public async fillKeyBuffer(
		keyIndex: KeyIndex,
		imageBuffer: Uint8Array | Uint8ClampedArray,
		options: FillImageOptions | undefined,
		signal: AbortSignal | null,
	): Promise<boolean> {
		const { control, sourceOptions } = this.checkFillKeyBuffer(keyIndex, imageBuffer, options)
		return this.fillImageRangeControl(control, imageBuffer, sourceOptions, signal)
	}

	private checkFillKeyBuffer(
		keyIndex: KeyIndex,
		imageBuffer: Uint8Array | Uint8ClampedArray,
		options: FillImageOptions | undefined,
	): { control: StreamDeckButtonControlDefinitionLcdFeedback; sourceOptions: InternalFillImageOptions } {
		const sourceFormat = options?.format ?? 'rgb'
		this.checkSourceFormat(sourceFormat)

		const control = this.#deviceProperties.controls.find(
			(control): control is StreamDeckButtonControlDefinition =>
				control.type === 'button' && control.index === keyIndex,
		)
		if (!control || control.feedbackType === 'none') throw new TypeError(`Expected a valid keyIndex`)

		if (control.feedbackType !== 'lcd')
			throw new TypeError(`keyIndex ${control.index} does not support lcd feedback`)

		const imageSize = control.pixelSize.width * control.pixelSize.height * sourceFormat.length
		if (imageBuffer.length !== imageSize) {
			throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`)
		}

		return {
			control,
			sourceOptions: {
				format: sourceFormat,
				offset: 0,
				stride: control.pixelSize.width * sourceFormat.length,
			},
		}
	}

	public async prepareFillKeyBuffer(
		keyIndex: KeyIndex,
		imageBuffer: Uint8Array | Uint8ClampedArray,
		options: FillImageOptions | undefined,
		jsonSafe: boolean | undefined,
	): Promise<PreparedBuffer> {
		const { control, sourceOptions } = this.checkFillKeyBuffer(keyIndex, imageBuffer, options)
		const packets = await this.prepareFillImageRangeControl(control, imageBuffer, sourceOptions)
		return wrapBufferToPreparedBuffer(this.#deviceProperties.model, 'fill-key', packets, jsonSafe ?? false)
	}

	public async fillPanelBuffer(
		imageBuffer: Uint8Array | Uint8ClampedArray,
		options: FillPanelOptions | undefined,
		signal: AbortSignal | null,
	): Promise<boolean> {
		const panelFill = this.checkFillPanelBuffer(imageBuffer, options)

		return this.#pendingWrites.run(
			PANEL_WRITE_KEY,
			signal,
			async (ctx) => {
				// Avoid encoding an image which will not be sent
				if (ctx.signal?.aborted) return false

				const packets = await this.prepareFillPanelBufferInner(imageBuffer, panelFill)
				return ctx.commit(async (writeSignal) => this.#device.sendReports(packets, writeSignal))
			},
			// The panel covers every key, so must be sent after any pending writes to them
			this.getAllKeyWriteKeys(),
		)
	}

	private getAllKeyWriteKeys(): string[] {
		return this.#deviceProperties.controls
			.filter((control) => control.type === 'button')
			.map((control) => keyWriteKey(control.hidIndex))
	}

	private checkFillPanelBuffer(
		imageBuffer: Uint8Array | Uint8ClampedArray,
		options: FillPanelOptions | undefined,
	): CheckedPanelFill {
		const sourceFormat = options?.format ?? 'rgb'
		this.checkSourceFormat(sourceFormat)

		const buttonLcdControls = this.getLcdButtonControls()
		const panelGridSpan = this.calculateLcdGridSpan(buttonLcdControls)

		if (!panelGridSpan || buttonLcdControls.length === 0) {
			throw new Error(`Panel does not support being filled`)
		}

		const panelDimensions = this.calculateDimensionsFromGridSpan(
			panelGridSpan,
			buttonLcdControls[0].pixelSize,
			options?.withPadding,
		)

		const expectedByteCount = sourceFormat.length * panelDimensions.width * panelDimensions.height
		if (imageBuffer.length !== expectedByteCount) {
			throw new RangeError(
				`Expected image buffer of length ${expectedByteCount}, got length ${imageBuffer.length}`,
			)
		}

		return {
			sourceFormat,
			buttonLcdControls,
			panelGridSpan,
			stride: panelDimensions.width * sourceFormat.length,
		}
	}

	private async prepareFillPanelBufferInner(
		imageBuffer: Uint8Array | Uint8ClampedArray,
		{ sourceFormat, buttonLcdControls, panelGridSpan, stride }: CheckedPanelFill,
	): Promise<Uint8Array[]> {
		const ps: Array<Promise<Uint8Array[]>> = []
		for (const control of buttonLcdControls) {
			const controlRow = control.row - panelGridSpan.minRow
			const controlCol = control.column - panelGridSpan.minCol

			// TODO: Consider that different rows/columns could have different dimensions
			const iconSize = control.pixelSize.width * sourceFormat.length

			const rowOffset = stride * controlRow * control.pixelSize.height
			const colOffset = controlCol * iconSize

			// TODO: Implement padding
			ps.push(
				this.prepareFillImageRangeControl(control, imageBuffer, {
					format: sourceFormat,
					offset: rowOffset + colOffset,
					stride,
				}),
			)
		}

		const packets = await Promise.all(ps)
		return packets.flat()
	}

	public async prepareFillPanelBuffer(
		imageBuffer: Uint8Array | Uint8ClampedArray,
		options: FillPanelOptions | undefined,
		jsonSafe: boolean | undefined,
	): Promise<PreparedBuffer> {
		const panelFill = this.checkFillPanelBuffer(imageBuffer, options)
		const packets = await this.prepareFillPanelBufferInner(imageBuffer, panelFill)
		return wrapBufferToPreparedBuffer(this.#deviceProperties.model, 'fill-panel', packets, jsonSafe ?? false)
	}

	private async sendKeyRgb(
		hidIndex: number,
		red: number,
		green: number,
		blue: number,
		signal: AbortSignal | null,
	): Promise<boolean> {
		return this.#pendingWrites.run(
			keyWriteKey(hidIndex),
			signal,
			async (ctx) =>
				ctx.commit(async (writeSignal) =>
					this.#device.sendFeatureReport(
						new Uint8Array([0x03, 0x06, hidIndex, red, green, blue]),
						writeSignal,
					),
				),
			[PANEL_WRITE_KEY],
		)
	}

	private async fillImageRangeControl(
		buttonControl: StreamDeckButtonControlDefinitionLcdFeedback,
		imageBuffer: Uint8Array | Uint8ClampedArray,
		sourceOptions: InternalFillImageOptions,
		signal: AbortSignal | null,
	): Promise<boolean> {
		return this.#pendingWrites.run(
			keyWriteKey(buttonControl.hidIndex),
			signal,
			async (ctx) => {
				// Avoid encoding an image which will not be sent
				if (ctx.signal?.aborted) return false

				const packets = await this.prepareFillImageRangeControl(buttonControl, imageBuffer, sourceOptions)
				return ctx.commit(async (writeSignal) => this.#device.sendReports(packets, writeSignal))
			},
			[PANEL_WRITE_KEY],
		)
	}

	private async prepareFillImageRangeControl(
		buttonControl: StreamDeckButtonControlDefinitionLcdFeedback,
		imageBuffer: Uint8Array | Uint8ClampedArray,
		sourceOptions: InternalFillImageOptions,
	): Promise<Uint8Array[]> {
		if (buttonControl.feedbackType !== 'lcd')
			throw new TypeError(`keyIndex ${buttonControl.index} does not support lcd feedback`)

		const byteBuffer = await this.#imagePacker.convertPixelBuffer(
			imageBuffer,
			sourceOptions,
			buttonControl.pixelSize,
		)

		return this.#imageWriter.generateFillImageWrites({ keyIndex: buttonControl.hidIndex }, byteBuffer)
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
