import type { HIDDevice as CoreHIDDevice, HIDDeviceEvents, HIDDeviceInfo } from '@elgato-stream-deck/core'
import type { ChildHIDDeviceInfo } from '@elgato-stream-deck/core/dist/hid-device'
import { EventEmitter } from 'eventemitter3'
import Queue from 'p-queue'

/**
 * The wrapped browser HIDDevice.
 * This translates it into the common format expected by @elgato-stream-deck/core
 */
export class WebHIDDevice extends EventEmitter<HIDDeviceEvents> implements CoreHIDDevice {
	private readonly device: HIDDevice

	private readonly reportQueue = new Queue({ concurrency: 1 })
	private readonly reportByteLengths = new Map<number, number>()

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

		// calculate byte length for all feature reports
		const featureReports = this.device.collections.map((c) => c.featureReports ?? []).flat()
		for (const report of featureReports) {
			if (report.reportId && report.items) {
				const bitsLength = report.items.reduce(
					(sum, item) => sum + (item.reportSize ?? 0) * (item.reportCount ?? 0),
					0,
				)
				this.reportByteLengths.set(report.reportId, Math.ceil(bitsLength / 8.0))
			}
		}
	}

	public async close(): Promise<void> {
		return this.device.close()
	}

	public async forget(): Promise<void> {
		return this.device.forget()
	}

	public async sendFeatureReport(data: Uint8Array): Promise<void> {
		// Ensure the buffer is as long as required for the feature report
		const byteLength = this.reportByteLengths.get(data[0])
		let dataFull = data.subarray(1)
		if (byteLength && dataFull.length != byteLength) {
			dataFull = new Uint8Array(byteLength)
			dataFull.set(data.subarray(1, Math.min(data.length - 1, dataFull.length)))
		}

		return this.device.sendFeatureReport(data[0], dataFull)
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

	public async getChildDeviceInfo(): Promise<ChildHIDDeviceInfo | null> {
		// Not supported
		return null
	}
}
