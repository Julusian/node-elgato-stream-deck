import EventEmitter = require('events')
import { ChildHIDDeviceInfo, HIDDevice, HIDDeviceEvents, HIDDeviceInfo } from './hid-device'

/**
 * In some backends, the child device works over the same stream as the primary, and uses offsets and things
 */
export class ChildHIDDevice extends EventEmitter<HIDDeviceEvents> implements HIDDevice {
	readonly #parentDevice: HIDDevice
	readonly #hidInfo: HIDDeviceInfo

	constructor(parentDevice: HIDDevice, hidInfo: HIDDeviceInfo) {
		super()

		this.#parentDevice = parentDevice
		this.#hidInfo = hidInfo

		this.#parentDevice.on('input', this.#onInputReport)
	}

	#onInputReport = (data: Uint8Array) => this.emit('input', data)

	close(): Promise<void> {
		// TODO - make sure this is called correctly
		this.#parentDevice.off('input', this.#onInputReport)
		throw new Error('Method not implemented.')
	}
	async sendFeatureReport(data: Uint8Array): Promise<void> {
		return this.#parentDevice.sendFeatureReport(data)
	}
	async getFeatureReport(reportId: number, reportLength: number): Promise<Uint8Array> {
		return this.#parentDevice.getFeatureReport(reportId, reportLength)
	}
	async sendReports(buffers: Uint8Array[]): Promise<void> {
		await this.#parentDevice.sendReports(buffers)
	}
	async getDeviceInfo(): Promise<HIDDeviceInfo> {
		return this.#hidInfo
	}
	async openChildDevice(): Promise<HIDDevice | null> {
		// Chaining not supported
		return null
	}

	async getChildDeviceInfo(): Promise<ChildHIDDeviceInfo | null> {
		// Chaining not supported
		return null
	}
}
