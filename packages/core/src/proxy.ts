import * as EventEmitter from 'eventemitter3'
import { DeviceModelId, KeyIndex, StreamDeck, FillImageOptions, FillPanelOptions } from './models'
import { StreamDeckEvents } from './models/types'

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
	public get ICON_SIZE(): number {
		return this.device.ICON_SIZE
	}
	public get ICON_BYTES(): number {
		return this.device.ICON_BYTES
	}
	public get ICON_PIXELS(): number {
		return this.device.ICON_PIXELS
	}
	public get MODEL(): DeviceModelId {
		return this.device.MODEL
	}
	public get PRODUCT_NAME(): string {
		return this.device.PRODUCT_NAME
	}

	public checkValidKeyIndex(keyIndex: KeyIndex): void {
		this.device.checkValidKeyIndex(keyIndex)
	}

	public async close(): Promise<void> {
		return this.device.close()
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

	public eventNames(): Array<EventEmitter.EventNames<StreamDeckEvents>> {
		return this.device.eventNames()
	}

	public listeners<T extends EventEmitter.EventNames<StreamDeckEvents>>(
		event: T
	): Array<EventEmitter.EventListener<StreamDeckEvents, T>> {
		return this.device.listeners(event)
	}

	public listenerCount(event: EventEmitter.EventNames<StreamDeckEvents>): number {
		return this.device.listenerCount(event)
	}

	public emit<T extends EventEmitter.EventNames<StreamDeckEvents>>(
		event: T,
		...args: EventEmitter.EventArgs<StreamDeckEvents, T>
	): boolean {
		return this.device.emit(event, ...args)
	}

	/**
	 * Add a listener for a given event.
	 */
	public on<T extends EventEmitter.EventNames<StreamDeckEvents>>(
		event: T,
		fn: EventEmitter.EventListener<StreamDeckEvents, T>,
		context?: unknown
	): this {
		this.device.on(event, fn, context)
		return this
	}
	public addListener<T extends EventEmitter.EventNames<StreamDeckEvents>>(
		event: T,
		fn: EventEmitter.EventListener<StreamDeckEvents, T>,
		context?: unknown
	): this {
		this.device.addListener(event, fn, context)
		return this
	}

	/**
	 * Add a one-time listener for a given event.
	 */
	public once<T extends EventEmitter.EventNames<StreamDeckEvents>>(
		event: T,
		fn: EventEmitter.EventListener<StreamDeckEvents, T>,
		context?: unknown
	): this {
		this.device.once(event, fn, context)
		return this
	}

	/**
	 * Remove the listeners of a given event.
	 */
	public removeListener<T extends EventEmitter.EventNames<StreamDeckEvents>>(
		event: T,
		fn?: EventEmitter.EventListener<StreamDeckEvents, T>,
		context?: unknown,
		once?: boolean
	): this {
		this.device.removeListener(event, fn, context, once)
		return this
	}
	public off<T extends EventEmitter.EventNames<StreamDeckEvents>>(
		event: T,
		fn?: EventEmitter.EventListener<StreamDeckEvents, T>,
		context?: unknown,
		once?: boolean
	): this {
		this.device.off(event, fn, context, once)
		return this
	}

	public removeAllListeners(event?: EventEmitter.EventNames<StreamDeckEvents>): this {
		this.device.removeAllListeners(event)
		return this
	}
}
