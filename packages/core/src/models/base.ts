import { EventEmitter } from 'events'

import { HIDDevice, HIDDeviceInfo } from '../device'
import { DeviceModelId, KeyIndex } from '../id'
import { FillImageOptions, FillPanelOptions, StreamDeck, StreamDeckEvents, StreamDeckLcdStripService } from '../types'
import type { StreamdeckImageWriter } from '../imageWriter/types'

export type EncodeJPEGHelper = (buffer: Buffer, width: number, height: number) => Promise<Buffer>

export interface OpenStreamDeckOptions {
	useOriginalKeyOrder?: boolean
	encodeJPEG?: EncodeJPEGHelper
}

export type StreamDeckProperties = Readonly<{
	MODEL: DeviceModelId
	PRODUCT_NAME: string
	COLUMNS: number
	ROWS: number
	TOUCH_BUTTONS: number
	BUTTON_WIDTH_PX: number
	BUTTON_HEIGHT_PX: number
	KEY_DIRECTION: 'ltr' | 'rtl'
	KEY_DATA_OFFSET: number
	ENCODER_COUNT: number
	SUPPORTS_RGB_KEY_FILL: boolean

	KEY_SPACING_HORIZONTAL: number
	KEY_SPACING_VERTICAL: number
}>

export type StreamDeckGen1Properties = Omit<StreamDeckProperties, 'KEY_DATA_OFFSET' | 'TOUCH_BUTTONS' | 'ENCODER_COUNT'>
export type StreamDeckGen2Properties = Omit<
	StreamDeckProperties,
	'KEY_DATA_OFFSET' | 'KEY_DIRECTION' | 'SUPPORTS_RGB_KEY_FILL'
>

export interface InternalFillImageOptions extends FillImageOptions {
	offset: number
	stride: number
}

export abstract class StreamDeckInputBase extends EventEmitter<StreamDeckEvents> implements StreamDeck {
	get NUM_KEYS(): number {
		return this.KEY_COLUMNS * this.KEY_ROWS
	}
	get KEY_COLUMNS(): number {
		return this.deviceProperties.COLUMNS
	}
	get KEY_ROWS(): number {
		return this.deviceProperties.ROWS
	}
	get NUM_TOUCH_KEYS(): number {
		return this.deviceProperties.TOUCH_BUTTONS
	}

	get NUM_ENCODERS(): number {
		return this.deviceProperties.ENCODER_COUNT
	}

	get BUTTON_WIDTH_PX(): number {
		return this.deviceProperties.BUTTON_WIDTH_PX
	}
	get BUTTON_HEIGHT_PX(): number {
		return this.deviceProperties.BUTTON_HEIGHT_PX
	}
	get BUTTON_RGB_BYTES(): number {
		return this.BUTTON_TOTAL_PX * 3
	}
	get BUTTON_TOTAL_PX(): number {
		return this.BUTTON_WIDTH_PX * this.BUTTON_HEIGHT_PX
	}

	get KEY_SPACING_HORIZONTAL(): number {
		return this.deviceProperties.KEY_SPACING_HORIZONTAL
	}
	get KEY_SPACING_VERTICAL(): number {
		return this.deviceProperties.KEY_SPACING_VERTICAL
	}

	get MODEL(): DeviceModelId {
		return this.deviceProperties.MODEL
	}
	get PRODUCT_NAME(): string {
		return this.deviceProperties.PRODUCT_NAME
	}

	get lcdStrip(): StreamDeckLcdStripService | null {
		// Overridden by models which support this
		return null
	}

	protected readonly device: HIDDevice
	protected readonly deviceProperties: Readonly<StreamDeckProperties>
	// private readonly options: Readonly<OpenStreamDeckOptions>
	private readonly keyState: boolean[]

	constructor(device: HIDDevice, _options: OpenStreamDeckOptions, properties: StreamDeckProperties) {
		super()

		this.deviceProperties = properties
		this.device = device

		this.keyState = new Array<boolean>(this.NUM_KEYS + this.NUM_TOUCH_KEYS).fill(false)

		this.device.on('input', (data: Uint8Array) => this.handleInputBuffer(data))

		this.device.on('error', (err) => {
			this.emit('error', err)
		})
	}

	protected handleInputBuffer(data: Uint8Array): void {
		const totalKeyCount = this.NUM_KEYS + this.NUM_TOUCH_KEYS
		const keyData = data.subarray(this.deviceProperties.KEY_DATA_OFFSET || 0)
		for (let i = 0; i < totalKeyCount; i++) {
			const keyPressed = Boolean(keyData[i])
			const keyIndex = this.transformKeyIndex(i)
			const stateChanged = keyPressed !== this.keyState[keyIndex]
			if (stateChanged) {
				this.keyState[keyIndex] = keyPressed
				if (keyPressed) {
					this.emit('down', keyIndex)
				} else {
					this.emit('up', keyIndex)
				}
			}
		}
	}

	public checkValidKeyIndex(keyIndex: KeyIndex, includeTouchKeys?: boolean): void {
		const totalKeys = this.NUM_KEYS + (includeTouchKeys ? this.NUM_TOUCH_KEYS : 0)
		if (keyIndex < 0 || keyIndex >= totalKeys) {
			throw new TypeError(`Expected a valid keyIndex 0 - ${totalKeys - 1}`)
		}
	}

	public async close(): Promise<void> {
		return this.device.close()
	}

	public async getHidDeviceInfo(): Promise<HIDDeviceInfo> {
		return this.device.getDeviceInfo()
	}

	public abstract setBrightness(percentage: number): Promise<void>

	public abstract resetToLogo(): Promise<void>

	public abstract getFirmwareVersion(): Promise<string>
	public abstract getSerialNumber(): Promise<string>

	protected transformKeyIndex(keyIndex: KeyIndex): KeyIndex {
		return keyIndex
	}

	public abstract fillKeyColor(keyIndex: KeyIndex, r: number, g: number, b: number): Promise<void>
	public abstract fillKeyBuffer(keyIndex: KeyIndex, imageBuffer: Buffer, options?: FillImageOptions): Promise<void>
	public abstract fillPanelBuffer(imageBuffer: Buffer, options?: FillPanelOptions): Promise<void>

	public abstract clearKey(keyIndex: KeyIndex): Promise<void>
	public abstract clearPanel(): Promise<void>
}

export abstract class StreamDeckBase extends StreamDeckInputBase {
	protected readonly imageWriter: StreamdeckImageWriter

	constructor(
		device: HIDDevice,
		options: OpenStreamDeckOptions,
		properties: StreamDeckProperties,
		imageWriter: StreamdeckImageWriter
	) {
		super(device, options, properties)
		this.imageWriter = imageWriter
	}

	public async fillKeyColor(keyIndex: KeyIndex, r: number, g: number, b: number): Promise<void> {
		this.checkValidKeyIndex(keyIndex, true)

		this.checkRGBValue(r)
		this.checkRGBValue(g)
		this.checkRGBValue(b)

		if (this.deviceProperties.SUPPORTS_RGB_KEY_FILL || keyIndex >= this.NUM_KEYS) {
			await this.sendKeyRgb(keyIndex, r, g, b)
		} else {
			const pixels = Buffer.alloc(this.BUTTON_RGB_BYTES, Buffer.from([r, g, b]))
			const keyIndex2 = this.transformKeyIndex(keyIndex)
			await this.fillImageRange(keyIndex2, pixels, {
				format: 'rgb',
				offset: 0,
				stride: this.BUTTON_WIDTH_PX * 3,
			})
		}
	}

	public async fillKeyBuffer(keyIndex: KeyIndex, imageBuffer: Buffer, options?: FillImageOptions): Promise<void> {
		this.checkValidKeyIndex(keyIndex)

		const sourceFormat = options?.format ?? 'rgb'
		this.checkSourceFormat(sourceFormat)

		const imageSize = this.BUTTON_TOTAL_PX * sourceFormat.length
		if (imageBuffer.length !== imageSize) {
			throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`)
		}

		const keyIndex2 = this.transformKeyIndex(keyIndex)
		await this.fillImageRange(keyIndex2, imageBuffer, {
			format: sourceFormat,
			offset: 0,
			stride: this.BUTTON_WIDTH_PX * sourceFormat.length,
		})
	}

	public async fillPanelBuffer(imageBuffer: Buffer, options?: FillPanelOptions): Promise<void> {
		const sourceFormat = options?.format ?? 'rgb'
		this.checkSourceFormat(sourceFormat)

		const imageSize = this.BUTTON_TOTAL_PX * sourceFormat.length * this.NUM_KEYS
		if (imageBuffer.length !== imageSize) {
			throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`)
		}

		const iconSize = this.BUTTON_WIDTH_PX * sourceFormat.length
		const stride = iconSize * this.KEY_COLUMNS

		const ps: Array<Promise<void>> = []
		for (let row = 0; row < this.KEY_ROWS; row++) {
			const rowOffset = stride * row * this.BUTTON_HEIGHT_PX

			for (let column = 0; column < this.KEY_COLUMNS; column++) {
				let index = row * this.KEY_COLUMNS
				if (this.deviceProperties.KEY_DIRECTION === 'ltr') {
					index += column
				} else {
					index += this.KEY_COLUMNS - column - 1
				}

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
		await this.device.sendFeatureReport(Buffer.from([0x03, 0x06, keyIndex, red, green, blue]))
	}

	public async clearKey(keyIndex: KeyIndex): Promise<void> {
		this.checkValidKeyIndex(keyIndex, true)

		if (this.deviceProperties.SUPPORTS_RGB_KEY_FILL || keyIndex >= this.NUM_KEYS) {
			await this.sendKeyRgb(keyIndex, 0, 0, 0)
		} else {
			const pixels = Buffer.alloc(this.BUTTON_RGB_BYTES, 0)
			const keyIndex2 = this.transformKeyIndex(keyIndex)
			await this.fillImageRange(keyIndex2, pixels, {
				format: 'rgb',
				offset: 0,
				stride: this.BUTTON_WIDTH_PX * 3,
			})
		}
	}

	protected clearPanelInner(): Promise<void>[] {
		const ps: Array<Promise<void>> = []

		if (this.deviceProperties.SUPPORTS_RGB_KEY_FILL) {
			for (let keyIndex = 0; keyIndex < this.NUM_KEYS; keyIndex++) {
				ps.push(this.sendKeyRgb(keyIndex, 0, 0, 0))
			}
		} else if (this.BUTTON_RGB_BYTES > 0) {
			const pixels = Buffer.alloc(this.BUTTON_RGB_BYTES, 0)
			for (let keyIndex = 0; keyIndex < this.NUM_KEYS; keyIndex++) {
				ps.push(
					this.fillImageRange(keyIndex, pixels, {
						format: 'rgb',
						offset: 0,
						stride: this.BUTTON_WIDTH_PX * 3,
					})
				)
			}
		}

		for (let buttonIndex = 0; buttonIndex < this.NUM_TOUCH_KEYS; buttonIndex++) {
			ps.push(this.clearKey(buttonIndex + this.NUM_KEYS))
		}

		return ps
	}

	public async clearPanel(): Promise<void> {
		await Promise.all(this.clearPanelInner())
	}

	protected abstract convertFillImage(imageBuffer: Buffer, sourceOptions: InternalFillImageOptions): Promise<Buffer>

	private async fillImageRange(keyIndex: KeyIndex, imageBuffer: Buffer, sourceOptions: InternalFillImageOptions) {
		this.checkValidKeyIndex(keyIndex)

		const byteBuffer = await this.convertFillImage(imageBuffer, sourceOptions)

		const packets = this.imageWriter.generateFillImageWrites({ keyIndex }, byteBuffer)
		await this.device.sendReports(packets)
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
