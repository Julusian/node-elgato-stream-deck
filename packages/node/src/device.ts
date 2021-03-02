import { DeviceModelId, HIDDevice } from '@elgato-stream-deck/core'
import { EventEmitter } from 'events'
import exitHook = require('exit-hook')
import * as HID from 'node-hid'

export interface StreamDeckDeviceInfo {
	model: DeviceModelId
	path: string
	serialNumber?: string
}

export class NodeHIDDevice extends EventEmitter implements HIDDevice {
	public dataKeyOffset?: number
	private device: HID.HID
	private readonly releaseExitHook: () => void

	constructor(deviceInfo: StreamDeckDeviceInfo) {
		super()

		this.device = new HID.HID(deviceInfo.path)
		this.device.on('error', (error) => this.emit('error', error))

		this.releaseExitHook = exitHook(() => {
			// Ignore errors, as device is already closed
			this.close().catch(() => null)
		})

		this.device.on('data', (data) => {
			// Button press
			if (data[0] === 0x01) {
				const keyData = data.slice(this.dataKeyOffset || 0, data.length - 1)
				this.emit('input', keyData)
			}
		})
	}

	public async close(): Promise<void> {
		this.releaseExitHook()
		// TODO - fix this
		// if (this.resetToLogoOnExit) {
		// 	// This makes the reset happen much quicker than the default timeout
		// 	this.resetToLogo()
		// }
		this.device.close()
	}

	public async sendFeatureReport(data: Buffer): Promise<void> {
		this.device.sendFeatureReport(data)
	}
	public async getFeatureReport(reportId: number, reportLength: number): Promise<number[]> {
		return this.device.getFeatureReport(reportId, reportLength)
	}
	public async sendReport(data: Buffer): Promise<void> {
		this.device.write(data)
	}
}
