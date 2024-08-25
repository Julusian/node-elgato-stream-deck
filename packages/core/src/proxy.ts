import type * as EventEmitter from 'eventemitter3'
import type { DeviceModelId } from './id.js'
import type { StreamDeck, StreamDeckEvents } from './types.js'
import type { StreamDeckControlDefinition } from './controlDefinition.js'

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
	// public get KEY_SPACING_VERTICAL(): number {
	// 	return this.device.KEY_SPACING_VERTICAL
	// }
	// public get KEY_SPACING_HORIZONTAL(): number {
	// 	return this.device.KEY_SPACING_HORIZONTAL
	// }
	public get MODEL(): DeviceModelId {
		return this.device.MODEL
	}
	public get PRODUCT_NAME(): string {
		return this.device.PRODUCT_NAME
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

	public async fillLcd(...args: Parameters<StreamDeck['fillLcd']>): ReturnType<StreamDeck['fillLcd']> {
		return this.device.fillLcd(...args)
	}

	public async fillLcdRegion(
		...args: Parameters<StreamDeck['fillLcdRegion']>
	): ReturnType<StreamDeck['fillLcdRegion']> {
		return this.device.fillLcdRegion(...args)
	}

	public async clearLcdStrip(
		...args: Parameters<StreamDeck['clearLcdStrip']>
	): ReturnType<StreamDeck['clearLcdStrip']> {
		return this.device.clearLcdStrip(...args)
	}

	/**
	 * EventEmitter
	 */

	public eventNames(): Array<EventEmitter.EventNames<StreamDeckEvents>> {
		return this.device.eventNames()
	}

	public listeners<T extends EventEmitter.EventNames<StreamDeckEvents>>(
		event: T,
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
		context?: unknown,
	): this {
		this.device.on(event, fn, context)
		return this
	}
	public addListener<T extends EventEmitter.EventNames<StreamDeckEvents>>(
		event: T,
		fn: EventEmitter.EventListener<StreamDeckEvents, T>,
		context?: unknown,
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
		context?: unknown,
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
		once?: boolean,
	): this {
		this.device.removeListener(event, fn, context, once)
		return this
	}
	public off<T extends EventEmitter.EventNames<StreamDeckEvents>>(
		event: T,
		fn?: EventEmitter.EventListener<StreamDeckEvents, T>,
		context?: unknown,
		once?: boolean,
	): this {
		this.device.off(event, fn, context, once)
		return this
	}

	public removeAllListeners(event?: EventEmitter.EventNames<StreamDeckEvents>): this {
		this.device.removeAllListeners(event)
		return this
	}
}
