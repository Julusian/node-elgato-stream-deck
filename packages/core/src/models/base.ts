import EventEmitter from 'eventemitter3'
import { HIDDevice, HIDDeviceInfo } from '../hid-device.js'
import { DeviceModelId, Dimension, KeyIndex } from '../id.js'
import type {
	FillImageOptions,
	FillPanelDimensionsOptions,
	FillPanelOptions,
	StreamDeck,
	StreamDeckEvents,
} from '../types.js'
import type { ButtonsLcdDisplayService } from '../services/buttonsLcdDisplay.js'
import type { StreamDeckButtonControlDefinition, StreamDeckControlDefinition } from '../controlDefinition.js'
import type { LcdStripDisplayService } from '../services/lcdStripDisplay.js'
import { PropertiesService } from '../services/propertiesService.js'

export type EncodeJPEGHelper = (buffer: Uint8Array, width: number, height: number) => Promise<Uint8Array>

export interface OpenStreamDeckOptions {
	encodeJPEG?: EncodeJPEGHelper
}

export type StreamDeckProperties = Readonly<{
	MODEL: DeviceModelId
	PRODUCT_NAME: string
	BUTTON_WIDTH_PX: number
	BUTTON_HEIGHT_PX: number
	KEY_DATA_OFFSET: number
	SUPPORTS_RGB_KEY_FILL: boolean

	CONTROLS: Readonly<StreamDeckControlDefinition[]>

	/**
	 * TODO - rework this
	 * @deprecated
	 */
	KEY_SPACING_HORIZONTAL: number
	/**
	 * TODO - rework this
	 * @deprecated
	 */
	KEY_SPACING_VERTICAL: number
}>

export class StreamDeckBase extends EventEmitter<StreamDeckEvents> implements StreamDeck {
	get CONTROLS(): Readonly<StreamDeckControlDefinition[]> {
		return this.deviceProperties.CONTROLS
	}

	get BUTTON_WIDTH_PX(): number {
		return this.deviceProperties.BUTTON_WIDTH_PX
	}
	get BUTTON_HEIGHT_PX(): number {
		return this.deviceProperties.BUTTON_HEIGHT_PX
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

	protected readonly device: HIDDevice
	protected readonly deviceProperties: Readonly<StreamDeckProperties>
	readonly #propertiesService: PropertiesService
	readonly #buttonsLcdService: ButtonsLcdDisplayService
	readonly #lcdStripDisplayService: LcdStripDisplayService | null
	// private readonly options: Readonly<OpenStreamDeckOptions>
	readonly #keyState: boolean[]

	constructor(
		device: HIDDevice,
		_options: OpenStreamDeckOptions,
		properties: StreamDeckProperties,
		propertiesService: PropertiesService,
		buttonsLcdService: ButtonsLcdDisplayService,
		lcdStripDisplayService: LcdStripDisplayService | null,
	) {
		super()

		this.deviceProperties = properties
		this.device = device
		this.#propertiesService = propertiesService
		this.#buttonsLcdService = buttonsLcdService
		this.#lcdStripDisplayService = lcdStripDisplayService

		const maxButtonIndex = properties.CONTROLS.filter(
			(control): control is StreamDeckButtonControlDefinition => control.type === 'button',
		).map((control) => control.index)
		this.#keyState = new Array<boolean>(Math.max(-1, ...maxButtonIndex) + 1).fill(false)

		this.device.on('input', (data: Uint8Array) => this.handleInputBuffer(data))

		this.device.on('error', (err) => {
			this.emit('error', err)
		})
	}

	protected handleInputBuffer(data: Uint8Array): void {
		const dataOffset = this.deviceProperties.KEY_DATA_OFFSET || 0

		for (const control of this.deviceProperties.CONTROLS) {
			if (control.type !== 'button') continue

			const keyPressed = Boolean(data[dataOffset + control.hidIndex])
			const stateChanged = keyPressed !== this.#keyState[control.index]
			if (stateChanged) {
				this.#keyState[control.index] = keyPressed
				if (keyPressed) {
					this.emit('down', control)
				} else {
					this.emit('up', control)
				}
			}
		}
	}

	protected checkValidKeyIndex(
		keyIndex: KeyIndex,
		feedbackType: StreamDeckButtonControlDefinition['feedbackType'] | null,
	): void {
		const buttonControl = this.deviceProperties.CONTROLS.find(
			(control): control is StreamDeckButtonControlDefinition =>
				control.type === 'button' && control.index === keyIndex,
		)

		if (!buttonControl) {
			throw new TypeError(`Expected a valid keyIndex`)
		}

		if (feedbackType && buttonControl.feedbackType !== feedbackType) {
			throw new TypeError(`Expected a keyIndex with expected feedbackType`)
		}
	}

	public calculateFillPanelDimensions(options?: FillPanelDimensionsOptions): Dimension | null {
		return this.#buttonsLcdService.calculateFillPanelDimensions(options)
	}

	public async close(): Promise<void> {
		return this.device.close()
	}

	public async getHidDeviceInfo(): Promise<HIDDeviceInfo> {
		return this.device.getDeviceInfo()
	}

	public async setBrightness(percentage: number): Promise<void> {
		return this.#propertiesService.setBrightness(percentage)
	}

	public async resetToLogo(): Promise<void> {
		return this.#propertiesService.resetToLogo()
	}

	public async getFirmwareVersion(): Promise<string> {
		return this.#propertiesService.getFirmwareVersion()
	}
	public async getSerialNumber(): Promise<string> {
		return this.#propertiesService.getSerialNumber()
	}

	public async fillKeyColor(keyIndex: KeyIndex, r: number, g: number, b: number): Promise<void> {
		this.checkValidKeyIndex(keyIndex, null)

		await this.#buttonsLcdService.fillKeyColor(keyIndex, r, g, b)
	}

	public async fillKeyBuffer(keyIndex: KeyIndex, imageBuffer: Uint8Array, options?: FillImageOptions): Promise<void> {
		this.checkValidKeyIndex(keyIndex, 'lcd')

		await this.#buttonsLcdService.fillKeyBuffer(keyIndex, imageBuffer, options)
	}

	public async fillPanelBuffer(imageBuffer: Uint8Array, options?: FillPanelOptions): Promise<void> {
		await this.#buttonsLcdService.fillPanelBuffer(imageBuffer, options)
	}

	public async clearKey(keyIndex: KeyIndex): Promise<void> {
		this.checkValidKeyIndex(keyIndex, null)

		await this.#buttonsLcdService.clearKey(keyIndex)
	}

	public async clearPanel(): Promise<void> {
		const ps: Array<Promise<void>> = []

		ps.push(this.#buttonsLcdService.clearPanel())

		if (this.#lcdStripDisplayService) {
			for (const control of this.deviceProperties.CONTROLS) {
				if (control.type !== 'lcd-strip') continue
				ps.push(this.#lcdStripDisplayService.clearLcdStrip(control.id))
			}
		}

		await Promise.all(ps)
	}

	public async fillLcd(...args: Parameters<StreamDeck['fillLcd']>): ReturnType<StreamDeck['fillLcd']> {
		if (!this.#lcdStripDisplayService) throw new Error('Not supported for this model')

		return this.#lcdStripDisplayService.fillLcd(...args)
	}

	// public async fillEncoderLcd(
	// 	...args: Parameters<StreamDeck['fillEncoderLcd']>
	// ): ReturnType<StreamDeck['fillEncoderLcd']> {
	// 	return this.device.fillEncoderLcd(...args)
	// }

	public async fillLcdRegion(
		...args: Parameters<StreamDeck['fillLcdRegion']>
	): ReturnType<StreamDeck['fillLcdRegion']> {
		if (!this.#lcdStripDisplayService) throw new Error('Not supported for this model')

		return this.#lcdStripDisplayService.fillLcdRegion(...args)
	}

	public async clearLcdStrip(
		...args: Parameters<StreamDeck['clearLcdStrip']>
	): ReturnType<StreamDeck['clearLcdStrip']> {
		if (!this.#lcdStripDisplayService) throw new Error('Not supported for this model')

		return this.#lcdStripDisplayService.clearLcdStrip(...args)
	}
}
