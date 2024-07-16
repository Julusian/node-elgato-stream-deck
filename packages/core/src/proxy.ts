import { DeviceModelId, KeyIndex } from './id'
import { StreamDeck, FillImageOptions, FillPanelOptions, StreamDeckEvents, StreamDeckLcdStripService } from './types'
import { HIDDeviceInfo } from './hid-device'
import { StreamDeckControlDefinition } from './models/controlDefinition'

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
	public get CONTROLS(): Readonly<StreamDeckControlDefinition[]> {
		return this.device.CONTROLS
	}
	public get BUTTON_WIDTH_PX(): number {
		return this.device.BUTTON_WIDTH_PX
	}
	public get BUTTON_HEIGHT_PX(): number {
		return this.device.BUTTON_HEIGHT_PX
	}
	public get BUTTON_RGB_BYTES(): number {
		return this.device.BUTTON_RGB_BYTES
	}
	public get BUTTON_TOTAL_PX(): number {
		return this.device.BUTTON_TOTAL_PX
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

	public get lcdStrip(): StreamDeckLcdStripService | null {
		return this.device.lcdStrip
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
