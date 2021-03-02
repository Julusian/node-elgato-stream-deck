import { DeviceModelId, HIDDevice as CoreHIDDevice } from '@elgato-stream-deck/core'
import { EventEmitter } from 'events'

export interface StreamDeckDeviceInfo {
	model: DeviceModelId
	path: string
	serialNumber?: string
}

export class WebHIDDevice extends EventEmitter implements CoreHIDDevice {
	public dataKeyOffset?: number
	private readonly device: HIDDevice

	constructor(device: HIDDevice) {
		super()

		this.device = device
		// this.device.on('data', data => this.emit('data', data))
		// this.device.on('error', error => this.emit('error', error))
		this.device.addEventListener('inputreport', (event) => {
			// Button press
			if (event.reportId === 0x01) {
				const data = new Uint8Array(event.data.buffer)
				const offset = this.dataKeyOffset || 1
				const buttons = Array.from(data).slice(offset - 1, data.length - 1)
				this.emit('input', buttons)
			}
		})
	}

	public close(): Promise<void> {
		return this.device.close()
	}

	public sendFeatureReport(data: Buffer): Promise<void> {
		return this.device.sendFeatureReport(data[0], new Uint8Array(data.slice(1)))
	}
	public async getFeatureReport(reportId: number, _reportLength: number): Promise<Buffer> {
		const view = await this.device.receiveFeatureReport(reportId)
		return Buffer.from(view.buffer)
	}
	public sendReport(data: Buffer): Promise<void> {
		return this.device.sendReport(data[0], new Uint8Array(data.slice(1)))
	}
}
