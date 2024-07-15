import { DeviceModelId, EncoderIndex, KeyIndex } from './id'
import {
	StreamDeck,
	FillImageOptions,
	FillPanelOptions,
	FillLcdImageOptions,
	LcdSegmentSize,
	StreamDeckEvents,
} from './types'
import { HIDDeviceInfo } from './device'

/**
 * A minimal proxy around a StreamDeck instance.
 * This is intended to be used by libraries wrapping this that want to add more methods to the StreamDeck
 */

export class StreamDeckProxy implements StreamDeck {
	protected device: StreamDeck

	constructor(device: StreamDeck) {
		this.device = device
	}

	public get NUM_KEYS(): number {
		return this.device.NUM_KEYS
	}
	public get KEY_COLUMNS(): number {
		return this.device.KEY_COLUMNS
	}
	public get KEY_ROWS(): number {
		return this.device.KEY_ROWS
	}
	get NUM_TOUCH_KEYS(): number {
		return this.device.NUM_TOUCH_KEYS
	}
	public get NUM_ENCODERS(): number {
		return this.device.NUM_ENCODERS
	}
	public get LCD_STRIP_SIZE(): LcdSegmentSize | undefined {
		return this.device.LCD_STRIP_SIZE
	}
	public get LCD_ENCODER_SIZE(): LcdSegmentSize | undefined {
		return this.device.LCD_ENCODER_SIZE
	}
	public get ICON_SIZE(): number {
		return this.device.ICON_SIZE
	}
	public get ICON_BYTES(): number {
		return this.device.ICON_BYTES
	}
	public get ICON_PIXELS(): number {
		return this.device.ICON_PIXELS
	}
	public get KEY_SPACING_VERTICAL(): number {
		return this.device.KEY_SPACING_VERTICAL
	}
	public get KEY_SPACING_HORIZONTAL(): number {
		return this.device.KEY_SPACING_HORIZONTAL
	}
	public get MODEL(): DeviceModelId {
		return this.device.MODEL
	}
	public get PRODUCT_NAME(): string {
		return this.device.PRODUCT_NAME
	}

	public checkValidKeyIndex(keyIndex: KeyIndex, includeTouchKeys?: boolean): void {
		this.device.checkValidKeyIndex(keyIndex, includeTouchKeys)
	}

	public async close(): Promise<void> {
		return this.device.close()
	}
	public async getHidDeviceInfo(): Promise<HIDDeviceInfo> {
		return this.device.getHidDeviceInfo()
	}
	public async fillKeyColor(keyIndex: KeyIndex, r: number, g: number, b: number): Promise<void> {
		return this.device.fillKeyColor(keyIndex, r, g, b)
	}
	public async fillKeyBuffer(keyIndex: KeyIndex, imageBuffer: Buffer, options?: FillImageOptions): Promise<void> {
		return this.device.fillKeyBuffer(keyIndex, imageBuffer, options)
	}
	public async fillPanelBuffer(imageBuffer: Buffer, options?: FillPanelOptions): Promise<void> {
		return this.device.fillPanelBuffer(imageBuffer, options)
	}
	public async clearKey(keyIndex: KeyIndex): Promise<void> {
		return this.device.clearKey(keyIndex)
	}
	public async clearPanel(): Promise<void> {
		return this.device.clearPanel()
	}
	public async setBrightness(percentage: number): Promise<void> {
		return this.device.setBrightness(percentage)
	}
	public async resetToLogo(): Promise<void> {
		return this.device.resetToLogo()
	}
	public async getFirmwareVersion(): Promise<string> {
		return this.device.getFirmwareVersion()
	}
	public async getSerialNumber(): Promise<string> {
		return this.device.getSerialNumber()
	}

	public async fillLcd(imageBuffer: Buffer, sourceOptions: FillImageOptions): Promise<void> {
		return this.device.fillLcd(imageBuffer, sourceOptions)
	}

	public async fillEncoderLcd(
		index: EncoderIndex,
		imageBuffer: Buffer,
		sourceOptions: FillImageOptions
	): Promise<void> {
		return this.device.fillEncoderLcd(index, imageBuffer, sourceOptions)
	}

	public async fillLcdRegion(
		x: number,
		y: number,
		imageBuffer: Buffer,
		sourceOptions: FillLcdImageOptions
	): Promise<void> {
		return this.device.fillLcdRegion(x, y, imageBuffer, sourceOptions)
	}

	/**
	 * EventEmitter
	 */

	public eventNames(): (keyof StreamDeckEvents)[] {
		return this.device.eventNames()
	}

	public listeners<K>(eventName: K | keyof StreamDeckEvents): TListener<K>[] {
		return this.device.listeners(eventName)
	}

	public rawListeners<K>(eventName: K | keyof StreamDeckEvents): TListener<K>[] {
		return this.device.rawListeners(eventName)
	}

	public getMaxListeners(): number {
		return this.device.getMaxListeners()
	}

	public setMaxListeners(n: number): this {
		this.device.setMaxListeners(n)
		return this
	}

	public emit<K extends keyof StreamDeckEvents>(
		event: K,
		...args: K extends keyof StreamDeckEvents
			? StreamDeckEvents[K] extends unknown[]
				? StreamDeckEvents[K]
				: never
			: never
	): boolean {
		return this.device.emit(event, ...args)
	}

	public addListener<K extends keyof StreamDeckEvents>(event: K, listener: TListener<K>): this {
		this.device.addListener(event, listener)
		return this
	}

	public listenerCount<K>(eventName: K | keyof StreamDeckEvents, listener?: TListener<K> | undefined): number {
		return this.device.listenerCount(eventName, listener)
	}

	public prependListener<K extends keyof StreamDeckEvents>(event: K, listener: TListener<K>): this {
		this.device.prependListener(event, listener)
		return this
	}

	public prependOnceListener<K extends keyof StreamDeckEvents>(event: K, listener: TListener<K>): this {
		this.device.prependOnceListener(event, listener)
		return this
	}

	public on<K extends keyof StreamDeckEvents>(event: K, listener: TListener<K>): this {
		this.device.on(event, listener)
		return this
	}

	public once<K extends keyof StreamDeckEvents>(event: K, listener: TListener<K>): this {
		this.device.once(event, listener)
		return this
	}

	public removeListener<K extends keyof StreamDeckEvents>(event: K, listener: TListener<K>): this {
		this.device.removeListener(event, listener)
		return this
	}

	public off<K extends keyof StreamDeckEvents>(event: K, listener: TListener<K>): this {
		this.device.off(event, listener)
		return this
	}

	public removeAllListeners<K extends keyof StreamDeckEvents>(event?: K): this {
		this.device.removeAllListeners(event)
		return this
	}
}

type TListener<K> = K extends keyof StreamDeckEvents
	? StreamDeckEvents[K] extends unknown[]
		? (...args: StreamDeckEvents[K]) => void
		: never
	: never
