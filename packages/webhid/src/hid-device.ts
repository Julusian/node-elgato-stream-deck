import type {
	ChildHIDDeviceInfo,
	HIDDevice as CoreHIDDevice,
	HIDDeviceEvents,
	HIDDeviceInfo,
} from '@elgato-stream-deck/core'
import { EventEmitter } from 'eventemitter3'
import Queue from 'p-queue'

/**
 * The wrapped browser HIDDevice.
 * This translates it into the common format expected by @elgato-stream-deck/core
 */
export class WebHIDDevice extends EventEmitter<HIDDeviceEvents> implements CoreHIDDevice {
	private readonly device: HIDDevice

	private readonly reportQueue = new Queue({ concurrency: 1 })

	constructor(device: HIDDevice) {
		super()

		this.device = device
		// this.device.on('data', data => this.emit('data', data))
		// this.device.on('error', error => this.emit('error', error))
		this.device.addEventListener('inputreport', (event) => {
			// Button press
			if (event.reportId === 0x01) {
				const data = new Uint8Array(event.data.buffer, event.data.byteOffset, event.data.byteLength)
				this.emit('input', data)
			}
		})
	}

	public async close(): Promise<void> {
		return this.device.close()
	}

	public async forget(): Promise<void> {
		return this.device.forget()
	}

	public async sendFeatureReport(data: Uint8Array): Promise<void> {
		return this.device.sendFeatureReport(data[0], data.subarray(1))
	}
	public async getFeatureReport(reportId: number, _reportLength: number): Promise<Uint8Array> {
		const view = await this.device.receiveFeatureReport(reportId)
		return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
	}
	public async sendReports(buffers: Uint8Array[]): Promise<void> {
		return this.reportQueue.add(async () => {
			for (const data of buffers) {
				await this.device.sendReport(data[0], data.subarray(1))
			}
		})
	}
	public async getDeviceInfo(): Promise<HIDDeviceInfo> {
		return {
			path: undefined,
			productId: this.device.productId,
			vendorId: this.device.vendorId,
		}
	}

	public async openChildDevice(): Promise<CoreHIDDevice | null> {
		// TODO - implement
		throw new Error('Method not implemented.')
	}

	public async getChildDeviceInfo(): Promise<ChildHIDDeviceInfo | null> {
		// TODO - implement
		throw new Error('Method not implemented.')
	}
}
