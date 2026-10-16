import { EventEmitter } from 'eventemitter3'
import type { HIDDevice, HIDDeviceInfo } from '../hid-device.js'
import type { DeviceModelId, Dimension, KeyIndex } from '../id.js'
import type {
	FillImageOptions,
	FillPanelDimensionsOptions,
	FillPanelOptions,
	StreamDeck,
	WriteOptions,
	StreamDeckEvents,
	StreamDeckTcpChildDeviceInfo,
} from '../types.js'
import type { ButtonsLcdDisplayService } from '../services/buttonsLcdDisplay/interface.js'
import type { StreamDeckButtonControlDefinition, StreamDeckControlDefinition } from '../controlDefinition.js'
import type { LcdSegmentDisplayService } from '../services/lcdSegmentDisplay/interface.js'
import type { PropertiesService } from '../services/properties/interface.js'
import type { CallbackHook } from '../services/callback-hook.js'
import type { StreamDeckInputService } from '../services/input/interface.js'
import { findModelByUsb } from '../modelInfo.js'
import type { StreamDeckModelInfo } from '../modelInfo.js'
import type { EncoderLedService } from '../services/encoderLed/interface.js'
import { unwrapPreparedBufferToBuffer, type PreparedBuffer } from '../preparedBuffer.js'

export type EncodeJPEGHelper = (buffer: Uint8Array, width: number, height: number) => Promise<Uint8Array>

export interface OpenStreamDeckOptions {
	encodeJPEG?: EncodeJPEGHelper
}

export type StreamDeckProperties = Readonly<{
	model: DeviceModelId
	productName: string
	keyDataOffset: number
	supportsRgbKeyFill: boolean

	controls: Readonly<StreamDeckControlDefinition[]>

	/** The extent of the face, which every control's `bounds` is within */
	faceSize: Dimension

	fullscreenPanels: number

	hasNfcReader: boolean

	/** Whether this device supports child devices */
	supportsChildDevices: boolean
}>

/**
 * The properties of a model which are known without a device present.
 * The identity of the model is applied when its `StreamDeckModelDefinition` is built
 */
export type StreamDeckStaticProperties = Omit<StreamDeckProperties, 'model' | 'productName'>

export interface StreamDeckServicesDefinition {
	modelInfo: StreamDeckModelInfo
	deviceProperties: StreamDeckProperties
	events: CallbackHook<StreamDeckEvents>
	properties: PropertiesService
	buttonsLcd: ButtonsLcdDisplayService
	inputService: StreamDeckInputService
	lcdSegmentDisplay: LcdSegmentDisplayService | null
	encoderLed: EncoderLedService | null
}

export class StreamDeckBase extends EventEmitter<StreamDeckEvents> implements StreamDeck {
	get modelInfo(): StreamDeckModelInfo {
		return this.#modelInfo
	}

	get CONTROLS(): Readonly<StreamDeckControlDefinition[]> {
		return this.deviceProperties.controls
	}

	get MODEL(): DeviceModelId {
		return this.deviceProperties.model
	}
	get PRODUCT_NAME(): string {
		return this.deviceProperties.productName
	}

	get HAS_NFC_READER(): boolean {
		return this.deviceProperties.hasNfcReader
	}

	protected readonly device: HIDDevice
	protected readonly deviceProperties: Readonly<StreamDeckProperties>
	readonly #modelInfo: StreamDeckModelInfo
	// readonly #options: Readonly<Required<OpenStreamDeckOptions>>
	readonly #propertiesService: PropertiesService
	readonly #buttonsLcdService: ButtonsLcdDisplayService
	readonly #lcdSegmentDisplayService: LcdSegmentDisplayService | null
	readonly #inputService: StreamDeckInputService
	readonly #encoderLedService: EncoderLedService | null

	constructor(
		device: HIDDevice,
		_options: Readonly<Required<OpenStreamDeckOptions>>,
		services: StreamDeckServicesDefinition,
	) {
		super()

		this.device = device
		this.#modelInfo = services.modelInfo
		this.deviceProperties = services.deviceProperties
		// this.#options = options
		this.#propertiesService = services.properties
		this.#buttonsLcdService = services.buttonsLcd
		this.#lcdSegmentDisplayService = services.lcdSegmentDisplay
		this.#inputService = services.inputService
		this.#encoderLedService = services.encoderLed

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
		const buttonControl = this.deviceProperties.controls.find(
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

	public async setBrightness(percentage: number, options?: WriteOptions): Promise<boolean> {
		return this.#propertiesService.setBrightness(percentage, options?.signal ?? null)
	}

	public async resetToLogo(): Promise<void> {
		return this.#propertiesService.resetToLogo()
	}

	public async getFirmwareVersion(): Promise<string> {
		return this.#propertiesService.getFirmwareVersion()
	}
	public async getAllFirmwareVersions(): Promise<Record<string, string>> {
		return this.#propertiesService.getAllFirmwareVersions()
	}
	public async getSerialNumber(): Promise<string> {
		return this.#propertiesService.getSerialNumber()
	}

	public async sendPreparedBuffer(buffer: PreparedBuffer, options?: WriteOptions): Promise<boolean> {
		const packets = unwrapPreparedBufferToBuffer(this.deviceProperties.model, buffer)
		// The target of a prepared buffer is not known, so it can't take part in superseding
		return this.device.sendReports(packets, options?.signal ?? null)
	}

	public async fillKeyColor(
		keyIndex: KeyIndex,
		r: number,
		g: number,
		b: number,
		options?: WriteOptions,
	): Promise<boolean> {
		this.checkValidKeyIndex(keyIndex, null)

		return this.#buttonsLcdService.fillKeyColor(keyIndex, r, g, b, options?.signal ?? null)
	}

	public async fillKeyBuffer(
		keyIndex: KeyIndex,
		imageBuffer: Uint8Array,
		options?: FillImageOptions & WriteOptions,
	): Promise<boolean> {
		this.checkValidKeyIndex(keyIndex, 'lcd')

		return this.#buttonsLcdService.fillKeyBuffer(keyIndex, imageBuffer, options, options?.signal ?? null)
	}

	public async prepareFillKeyBuffer(
		keyIndex: KeyIndex,
		imageBuffer: Uint8Array | Uint8ClampedArray,
		options?: FillImageOptions,
		jsonSafe?: boolean,
	): Promise<PreparedBuffer> {
		return this.#buttonsLcdService.prepareFillKeyBuffer(keyIndex, imageBuffer, options, jsonSafe)
	}

	public async fillPanelBuffer(imageBuffer: Uint8Array, options?: FillPanelOptions & WriteOptions): Promise<boolean> {
		return this.#buttonsLcdService.fillPanelBuffer(imageBuffer, options, options?.signal ?? null)
	}

	public async prepareFillPanelBuffer(
		imageBuffer: Uint8Array | Uint8ClampedArray,
		options?: FillPanelOptions,
		jsonSafe?: boolean,
	): Promise<PreparedBuffer> {
		return this.#buttonsLcdService.prepareFillPanelBuffer(imageBuffer, options, jsonSafe)
	}

	public async clearKey(keyIndex: KeyIndex, options?: WriteOptions): Promise<boolean> {
		this.checkValidKeyIndex(keyIndex, null)

		return this.#buttonsLcdService.clearKey(keyIndex, options?.signal ?? null)
	}

	public async clearPanel(options?: WriteOptions): Promise<boolean> {
		const signal = options?.signal ?? null
		const ps: Array<Promise<boolean>> = []

		ps.push(this.#buttonsLcdService.clearPanel(signal))

		if (this.#lcdSegmentDisplayService) ps.push(this.#lcdSegmentDisplayService.clearAllLcdSegments(signal))
		if (this.#encoderLedService) ps.push(this.#encoderLedService.clearAll(signal))

		const results = await Promise.all(ps)
		return results.every(Boolean)
	}

	public async fillLcd(
		...[lcdIndex, imageBuffer, sourceOptions]: Parameters<StreamDeck['fillLcd']>
	): ReturnType<StreamDeck['fillLcd']> {
		if (!this.#lcdSegmentDisplayService) throw new Error('Not supported for this model')

		return this.#lcdSegmentDisplayService.fillLcd(
			lcdIndex,
			imageBuffer,
			sourceOptions,
			sourceOptions.signal ?? null,
		)
	}

	public async fillLcdRegion(
		...[lcdIndex, x, y, imageBuffer, sourceOptions]: Parameters<StreamDeck['fillLcdRegion']>
	): ReturnType<StreamDeck['fillLcdRegion']> {
		if (!this.#lcdSegmentDisplayService) throw new Error('Not supported for this model')

		return this.#lcdSegmentDisplayService.fillLcdRegion(
			lcdIndex,
			x,
			y,
			imageBuffer,
			sourceOptions,
			sourceOptions.signal ?? null,
		)
	}

	public async prepareFillLcdRegion(
		...args: Parameters<StreamDeck['prepareFillLcdRegion']>
	): ReturnType<StreamDeck['prepareFillLcdRegion']> {
		if (!this.#lcdSegmentDisplayService) throw new Error('Not supported for this model')

		return this.#lcdSegmentDisplayService.prepareFillLcdRegion(...args)
	}

	public async clearLcdSegment(
		...[lcdIndex, options]: Parameters<StreamDeck['clearLcdSegment']>
	): ReturnType<StreamDeck['clearLcdSegment']> {
		if (!this.#lcdSegmentDisplayService) throw new Error('Not supported for this model')

		return this.#lcdSegmentDisplayService.clearLcdSegment(lcdIndex, options?.signal ?? null)
	}

	public async setEncoderColor(
		...[index, r, g, b, options]: Parameters<StreamDeck['setEncoderColor']>
	): ReturnType<StreamDeck['setEncoderColor']> {
		if (!this.#encoderLedService) throw new Error('Not supported for this model')

		return this.#encoderLedService.setEncoderColor(index, r, g, b, options?.signal ?? null)
	}
	public async setEncoderRingSingleColor(
		...[index, r, g, b, options]: Parameters<StreamDeck['setEncoderRingSingleColor']>
	): ReturnType<StreamDeck['setEncoderRingSingleColor']> {
		if (!this.#encoderLedService) throw new Error('Not supported for this model')

		return this.#encoderLedService.setEncoderRingSingleColor(index, r, g, b, options?.signal ?? null)
	}
	public async setEncoderRingColors(
		...[index, colors, options]: Parameters<StreamDeck['setEncoderRingColors']>
	): ReturnType<StreamDeck['setEncoderRingColors']> {
		if (!this.#encoderLedService) throw new Error('Not supported for this model')

		return this.#encoderLedService.setEncoderRingColors(index, colors, options?.signal ?? null)
	}

	public async getChildDeviceInfo(): Promise<StreamDeckTcpChildDeviceInfo | null> {
		const info = await this.device.getChildDeviceInfo()
		if (!info) return null

		const model = findModelByUsb(info.vendorId, info.productId)
		if (!model) return null

		return {
			...info,
			model: model.id,
		}
	}
}
