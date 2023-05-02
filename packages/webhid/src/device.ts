import { HIDDevice as CoreHIDDevice, HIDDeviceInfo } from '@elgato-stream-deck/core'
import { EventEmitter } from 'events'
import Queue from 'p-queue'

/**
 * The wrapped browser HIDDevice.
 * This translates it into the common format expected by @elgato-stream-deck/core
 */
export class WebHIDDevice extends EventEmitter implements CoreHIDDevice {
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
				const data = new Uint8Array(event.data.buffer)
				this.emit('input', data)
			}
		})
	}

	public async close(): Promise<void> {
		return this.device.close()
	}

	public async sendFeatureReport(data: Buffer): Promise<void> {
		return this.device.sendFeatureReport(data[0], new Uint8Array(data.subarray(1)))
	}
	public async getFeatureReport(reportId: number, _reportLength: number): Promise<Buffer> {
		const view = await this.device.receiveFeatureReport(reportId)
		return Buffer.from(view.buffer)
	}
	public async sendReports(buffers: Buffer[]): Promise<void> {
		return this.reportQueue.add(async () => {
			for (const data of buffers) {
				await this.device.sendReport(data[0], new Uint8Array(data.subarray(1)))
			}
		})
	}
	public async getDeviceInfo(): Promise<HIDDeviceInfo> {
		return {
			productId: this.device.productId,
			vendorId: this.device.vendorId,
		}
	}
}
