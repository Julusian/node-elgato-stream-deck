import { DeviceModelId, HIDDevice } from '@elgato-stream-deck/core'
import { EventEmitter } from 'events'
import * as HID from 'node-hid'

/**
 * Information about a found streamdeck
 */
export interface StreamDeckDeviceInfo {
	/** The model of the device */
	model: DeviceModelId
	/** The connected path of the device in the usb tree */
	path: string
	/** The serialNumber of the device. If set it can be used as a unique hardware identifier */
	serialNumber?: string
}

/**
 * The wrapped node-hid HIDDevice.
 * This translates it into the common format expected by @elgato-stream-deck/core
 */
export class NodeHIDDevice extends EventEmitter implements HIDDevice {
	public dataKeyOffset?: number
	private device: HID.HID

	constructor(deviceInfo: StreamDeckDeviceInfo) {
		super()

		this.device = new HID.HID(deviceInfo.path)
		this.device.on('error', (error) => this.emit('error', error))

		this.device.on('data', (data: Buffer) => {
			// Button press
			if (data[0] === 0x01) {
				const keyData = data.slice(this.dataKeyOffset || 0, data.length - 1)
				this.emit('input', keyData)
			}
		})
	}

	public async close(): Promise<void> {
		this.device.close()
	}

	public async sendFeatureReport(data: Buffer): Promise<void> {
		this.device.sendFeatureReport(data)
	}
	public async getFeatureReport(reportId: number, reportLength: number): Promise<Buffer> {
		return Buffer.from(this.device.getFeatureReport(reportId, reportLength))
	}
	public async sendReports(buffers: Buffer[]): Promise<void> {
		for (const data of buffers) {
			this.device.write(data)
		}
	}
}
