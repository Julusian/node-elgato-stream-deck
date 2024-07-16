import type { DeviceModelId } from './id'
import type { StreamDeck, StreamDeckEvents, StreamDeckLcdStripService } from './types'
import type { StreamDeckControlDefinition } from './models/controlDefinition'

/**
 * A minimal proxy around a StreamDeck instance.
 * This is intended to be used by libraries wrapping this that want to add more methods to the StreamDeck
 */

export class StreamDeckProxy implements StreamDeck {
	protected device: StreamDeck

	constructor(device: StreamDeck) {
		this.device = device
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

	public calculateFillPanelDimensions(
		...args: Parameters<StreamDeck['calculateFillPanelDimensions']>
	): ReturnType<StreamDeck['calculateFillPanelDimensions']> {
		return this.device.calculateFillPanelDimensions(...args)
	}

	public async close(): Promise<void> {
		return this.device.close()
	}
	public async getHidDeviceInfo(
		...args: Parameters<StreamDeck['getHidDeviceInfo']>
	): ReturnType<StreamDeck['getHidDeviceInfo']> {
		return this.device.getHidDeviceInfo(...args)
	}
	public async fillKeyColor(...args: Parameters<StreamDeck['fillKeyColor']>): ReturnType<StreamDeck['fillKeyColor']> {
		return this.device.fillKeyColor(...args)
	}
	public async fillKeyBuffer(
		...args: Parameters<StreamDeck['fillKeyBuffer']>
	): ReturnType<StreamDeck['fillKeyBuffer']> {
		return this.device.fillKeyBuffer(...args)
	}
	public async fillPanelBuffer(
		...args: Parameters<StreamDeck['fillPanelBuffer']>
	): ReturnType<StreamDeck['fillPanelBuffer']> {
		return this.device.fillPanelBuffer(...args)
	}
	public async clearKey(...args: Parameters<StreamDeck['clearKey']>): ReturnType<StreamDeck['clearKey']> {
		return this.device.clearKey(...args)
	}
	public async clearPanel(...args: Parameters<StreamDeck['clearPanel']>): ReturnType<StreamDeck['clearPanel']> {
		return this.device.clearPanel(...args)
	}
	public async setBrightness(
		...args: Parameters<StreamDeck['setBrightness']>
	): ReturnType<StreamDeck['setBrightness']> {
		return this.device.setBrightness(...args)
	}
	public async resetToLogo(...args: Parameters<StreamDeck['resetToLogo']>): ReturnType<StreamDeck['resetToLogo']> {
		return this.device.resetToLogo(...args)
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
