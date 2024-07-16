import { EventEmitter } from 'events'

import { HIDDevice, HIDDeviceInfo } from '../hid-device'
import { DeviceModelId, KeyIndex } from '../id'
import type {
	FillImageOptions,
	FillPanelOptions,
	StreamDeck,
	StreamDeckEvents,
	StreamDeckLcdStripService,
} from '../types'
import type { StreamdeckImageWriter } from '../services/imageWriter/types'
import type { ButtonLcdImagePacker, ButtonsLcdService } from '../services/buttonsLcd'
// import type { StreamDeckControlDefinition } from './controlDefinition'

export type EncodeJPEGHelper = (buffer: Buffer, width: number, height: number) => Promise<Buffer>

export interface OpenStreamDeckOptions {
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

	// CONTROLS: StreamDeckControlDefinition[]

	KEY_SPACING_HORIZONTAL: number
	KEY_SPACING_VERTICAL: number
}>

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
		if (this.deviceProperties.KEY_DIRECTION === 'ltr') {
			// Normal
			return keyIndex
		} else {
			// Horizontal flip
			const half = (this.KEY_COLUMNS - 1) / 2
			const diff = ((keyIndex % this.KEY_COLUMNS) - half) * -half
			return keyIndex + diff
		}
	}

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
		this.buttonsLcdService = new ButtonsLcdService(imageWriter, imagePacker, device)
	}

	public async fillKeyColor(keyIndex: KeyIndex, r: number, g: number, b: number): Promise<void> {
		this.checkValidKeyIndex(keyIndex, true)

		await this.buttonsLcdService.fillKeyColor(keyIndex, r, g, b)
	}

	public async fillKeyBuffer(keyIndex: KeyIndex, imageBuffer: Buffer, options?: FillImageOptions): Promise<void> {
		this.checkValidKeyIndex(keyIndex)

		await this.buttonsLcdService.fillKeyBuffer(keyIndex, imageBuffer, options)
	}

	public async fillPanelBuffer(imageBuffer: Buffer, options?: FillPanelOptions): Promise<void> {
		await this.buttonsLcdService.fillPanelBuffer(imageBuffer, options)
	}

	public async clearKey(keyIndex: KeyIndex): Promise<void> {
		this.checkValidKeyIndex(keyIndex, true)

		await this.buttonsLcdService.clearKey(keyIndex)
	}

	public async clearPanel(): Promise<void> {
		const ps: Array<Promise<void>> = []

		ps.push(this.buttonsLcdService.clearPanel())

		for (let buttonIndex = 0; buttonIndex < this.NUM_TOUCH_KEYS; buttonIndex++) {
			ps.push(this.clearKey(buttonIndex + this.NUM_KEYS))
		}

		await Promise.all(ps)
	}
}
