import * as EventEmitter from 'eventemitter3'
import type { HIDDevice, HIDDeviceInfo } from '../hid-device.js'
import type { DeviceModelId, Dimension, KeyIndex } from '../id.js'
import type {
	FillImageOptions,
	FillPanelDimensionsOptions,
	FillPanelOptions,
	StreamDeck,
	StreamDeckEvents,
} from '../types.js'
import type { ButtonsLcdDisplayService } from '../services/buttonsLcdDisplay/interface.js'
import type { StreamDeckButtonControlDefinition, StreamDeckControlDefinition } from '../controlDefinition.js'
import type { LcdSegmentDisplayService } from '../services/lcdSegmentDisplay/interface.js'
import type { PropertiesService } from '../services/properties/interface.js'
import type { CallbackHook } from '../services/callback-hook.js'
import type { StreamDeckInputService } from '../services/input/interface.js'

export type EncodeJPEGHelper = (buffer: Uint8Array, width: number, height: number) => Promise<Uint8Array>

export interface OpenStreamDeckOptions {
	encodeJPEG?: EncodeJPEGHelper
}

export type StreamDeckProperties = Readonly<{
	MODEL: DeviceModelId
	PRODUCT_NAME: string
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

export interface StreamDeckServicesDefinition {
	deviceProperties: StreamDeckProperties
	events: CallbackHook<StreamDeckEvents>
	properties: PropertiesService
	buttonsLcd: ButtonsLcdDisplayService
	inputService: StreamDeckInputService
	lcdSegmentDisplay: LcdSegmentDisplayService | null
}

export class StreamDeckBase extends EventEmitter<StreamDeckEvents> implements StreamDeck {
	get CONTROLS(): Readonly<StreamDeckControlDefinition[]> {
		return this.deviceProperties.CONTROLS
	}

	// get KEY_SPACING_HORIZONTAL(): number {
	// 	return this.deviceProperties.KEY_SPACING_HORIZONTAL
	// }
	// get KEY_SPACING_VERTICAL(): number {
	// 	return this.deviceProperties.KEY_SPACING_VERTICAL
	// }

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
	readonly #lcdSegmentDisplayService: LcdSegmentDisplayService | null
	readonly #inputService: StreamDeckInputService
	// private readonly options: Readonly<OpenStreamDeckOptions>

	constructor(device: HIDDevice, _options: OpenStreamDeckOptions, services: StreamDeckServicesDefinition) {
		super()

		this.device = device
		this.deviceProperties = services.deviceProperties
		this.#propertiesService = services.properties
		this.#buttonsLcdService = services.buttonsLcd
		this.#lcdSegmentDisplayService = services.lcdSegmentDisplay
		this.#inputService = services.inputService

		// propogate events
		services.events?.listen((key, ...args) => this.emit(key, ...args))

		this.device.on('input', (data: Uint8Array) => this.#inputService.handleInput(data))

		this.device.on('error', (err) => {
			this.emit('error', err)
		})
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

		if (this.#lcdSegmentDisplayService) ps.push(this.#lcdSegmentDisplayService.clearAllLcdSegments())

		await Promise.all(ps)
	}

	public async fillLcd(...args: Parameters<StreamDeck['fillLcd']>): ReturnType<StreamDeck['fillLcd']> {
		if (!this.#lcdSegmentDisplayService) throw new Error('Not supported for this model')

		return this.#lcdSegmentDisplayService.fillLcd(...args)
	}

	public async fillLcdRegion(
		...args: Parameters<StreamDeck['fillLcdRegion']>
	): ReturnType<StreamDeck['fillLcdRegion']> {
		if (!this.#lcdSegmentDisplayService) throw new Error('Not supported for this model')

		return this.#lcdSegmentDisplayService.fillLcdRegion(...args)
	}

	public async clearLcdSegment(
		...args: Parameters<StreamDeck['clearLcdSegment']>
	): ReturnType<StreamDeck['clearLcdSegment']> {
		if (!this.#lcdSegmentDisplayService) throw new Error('Not supported for this model')

		return this.#lcdSegmentDisplayService.clearLcdSegment(...args)
	}
}
