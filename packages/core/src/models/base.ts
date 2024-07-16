import { EventEmitter } from 'events'

import { HIDDevice, HIDDeviceInfo } from '../hid-device'
import { DeviceModelId, Dimension, KeyIndex } from '../id'
import type {
	FillImageOptions,
	FillPanelDimensionsOptions,
	FillPanelOptions,
	StreamDeck,
	StreamDeckEvents,
	StreamDeckLcdStripService,
} from '../types'
import type { StreamdeckImageWriter } from '../services/imageWriter/types'
import { ButtonLcdImagePacker, ButtonsLcdService } from '../services/buttonsLcd'
import type { StreamDeckButtonControlDefinition, StreamDeckControlDefinition } from './controlDefinition'

export type EncodeJPEGHelper = (buffer: Buffer, width: number, height: number) => Promise<Buffer>

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

export abstract class StreamDeckInputBase extends EventEmitter<StreamDeckEvents> implements StreamDeck {
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

		const maxButtonIndex = properties.CONTROLS.filter(
			(control): control is StreamDeckButtonControlDefinition => control.type === 'button'
		).map((control) => control.index)
		this.keyState = new Array<boolean>(Math.max(0, ...maxButtonIndex)).fill(false)

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
			const stateChanged = keyPressed !== this.keyState[control.index]
			if (stateChanged) {
				this.keyState[control.index] = keyPressed
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
		feedbackType: StreamDeckButtonControlDefinition['feedbackType'] | null
	): void {
		const buttonControl = this.deviceProperties.CONTROLS.find(
			(control): control is StreamDeckButtonControlDefinition =>
				control.type === 'button' && control.index === keyIndex
		)

		if (!buttonControl) {
			throw new TypeError(`Expected a valid keyIndex`)
		}

		if (feedbackType && buttonControl.feedbackType !== feedbackType) {
			throw new TypeError(`Expected a keyIndex with expected feedbackType`)
		}
	}

	public abstract calculateFillPanelDimensions(options?: FillPanelDimensionsOptions): Dimension | null

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

	public abstract fillKeyColor(keyIndex: KeyIndex, r: number, g: number, b: number): Promise<void>
	public abstract fillKeyBuffer(keyIndex: KeyIndex, imageBuffer: Buffer, options?: FillImageOptions): Promise<void>
	public abstract fillPanelBuffer(imageBuffer: Buffer, options?: FillPanelOptions): Promise<void>

	public abstract clearKey(keyIndex: KeyIndex): Promise<void>
	public abstract clearPanel(): Promise<void>
}

export abstract class StreamDeckBase extends StreamDeckInputBase {
	protected readonly buttonsLcdService: ButtonsLcdService

	constructor(
		device: HIDDevice,
		options: OpenStreamDeckOptions,
		properties: StreamDeckProperties,
		imageWriter: StreamdeckImageWriter,
		imagePacker: ButtonLcdImagePacker
	) {
		super(device, options, properties)
		this.buttonsLcdService = new ButtonsLcdService(imageWriter, imagePacker, device, properties)
	}

	public calculateFillPanelDimensions(options?: FillPanelDimensionsOptions): Dimension | null {
		return this.buttonsLcdService.calculateFillPanelDimensions(options)
	}

	public async fillKeyColor(keyIndex: KeyIndex, r: number, g: number, b: number): Promise<void> {
		this.checkValidKeyIndex(keyIndex, null)

		await this.buttonsLcdService.fillKeyColor(keyIndex, r, g, b)
	}

	public async fillKeyBuffer(keyIndex: KeyIndex, imageBuffer: Buffer, options?: FillImageOptions): Promise<void> {
		this.checkValidKeyIndex(keyIndex, 'lcd')

		await this.buttonsLcdService.fillKeyBuffer(keyIndex, imageBuffer, options)
	}

	public async fillPanelBuffer(imageBuffer: Buffer, options?: FillPanelOptions): Promise<void> {
		await this.buttonsLcdService.fillPanelBuffer(imageBuffer, options)
	}

	public async clearKey(keyIndex: KeyIndex): Promise<void> {
		this.checkValidKeyIndex(keyIndex, null)

		await this.buttonsLcdService.clearKey(keyIndex)
	}

	public async clearPanel(): Promise<void> {
		const ps: Array<Promise<void>> = []

		ps.push(this.buttonsLcdService.clearPanel())

		await Promise.all(ps)
	}
}
