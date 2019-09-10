import { DeviceModelId, HIDDevice } from 'elgato-stream-deck-core'
import { EventEmitter } from 'events'
import * as HID from 'node-hid'

export interface StreamDeckDeviceInfo {
	model: DeviceModelId
	path: string
	serialNumber?: string
}

export class NodeHIDDevice extends EventEmitter implements HIDDevice {
	private device: HID.HID

	constructor(deviceInfo: StreamDeckDeviceInfo) {
		super()

		this.device = new HID.HID(deviceInfo.path)
		this.device.on('data', data => this.emit('data', data))
		this.device.on('error', error => this.emit('error', error))
	}

	public sendFeatureReport(data: number[]): Promise<void> {
		// TODO - performance?
		this.device.sendFeatureReport(data)
		return Promise.resolve()
	}
	public getFeatureReport(reportId: number, reportLength: number): Promise<number[]> {
		return Promise.resolve(this.device.getFeatureReport(reportId, reportLength))
	}
	public sendReport(data: number[]): Promise<void> {
		this.device.write(data)
		return Promise.resolve()
	}
}
