import { DeviceModelId, HIDDevice } from 'elgato-stream-deck-core'
import { EventEmitter } from 'events'

export interface StreamDeckDeviceInfo {
	model: DeviceModelId
	path: string
	serialNumber?: string
}

// TODO - use better typings
export class WebHIDDevice extends EventEmitter implements HIDDevice {
	private device: any

	constructor(device: any) {
		super()

		this.device = device
		// this.device.on('data', data => this.emit('data', data))
		// this.device.on('error', error => this.emit('error', error))
		this.device.addEventListener('inputreport', (event: any) => {
			// Button press
			if (event.reportId === 0x01) {
				const data = new Uint8Array(event.data.buffer)
				for (let i = 0; i < 15; i++) {
					if (data[i]) {
						// TODO - properly
						console.log(`Pressed: ${i}`)
					}
				}
			}
		})
	}

	public sendFeatureReport(data: number[]): Promise<void> {
		return this.device.sendFeatureReport(data[0], new Uint8Array(data.slice(1)))
	}
	public getFeatureReport(reportId: number, reportLength: number): Promise<number[]> {
		return this.device
			.receiveFeatureReport(reportId, reportLength)
			.then((view: DataView) => Array.from(new Uint8Array(view.buffer)))
	}
	public sendReport(data: number[]): Promise<void> {
		return this.device.sendReport(data[0], new Uint8Array(data.slice(1)))
	}
}
