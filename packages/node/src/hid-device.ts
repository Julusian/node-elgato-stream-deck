import type {
	DeviceModelId,
	HIDDevice,
	HIDDeviceEvents,
	HIDDeviceInfo,
	ChildHIDDeviceInfo,
} from '@elgato-stream-deck/core'
import { EventEmitter } from 'eventemitter3'
import { ChildHIDDevice } from '@elgato-stream-deck/core'
import type { HIDAsync, Device as NodeHIDDeviceInfo } from 'node-hid'

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
export class NodeHIDDevice extends EventEmitter<HIDDeviceEvents> implements HIDDevice {
	private device: HIDAsync

	constructor(device: HIDAsync) {
		super()

		this.device = device
		this.device.on('error', (error) => this.emit('error', error))

		this.device.on('data', (data: Buffer) => {
			// Button press
			if (data[0] === 0x01) {
				const keyData = data.subarray(1)
				this.emit('input', keyData)
			}
		})
	}

	public async close(): Promise<void> {
		await this.device.close()
	}

	public async sendFeatureReport(data: Uint8Array): Promise<void> {
		await this.device.sendFeatureReport(Buffer.from(data)) // Future: avoid re-wrap
	}
	public async getFeatureReport(reportId: number, reportLength: number): Promise<Uint8Array> {
		return this.device.getFeatureReport(reportId, reportLength)
	}
	public async sendReports(buffers: Uint8Array[]): Promise<void> {
		const ps: Promise<any>[] = []
		for (const data of buffers) {
			ps.push(this.device.write(Buffer.from(data))) // Future: avoid re-wrap
		}
		await Promise.all(ps)
	}

	public async getDeviceInfo(): Promise<HIDDeviceInfo> {
		const info: NodeHIDDeviceInfo = await this.device.getDeviceInfo()

		return {
			path: info.path,
			productId: info.productId,
			vendorId: info.vendorId,
		}
	}

	public async openChildDevice(): Promise<HIDDevice | null> {
		const childInfo = await this.getChildDeviceInfo()
		if (!childInfo) return null

		return new ChildHIDDevice(this, childInfo)
	}

	public async getChildDeviceInfo(): Promise<ChildHIDDeviceInfo | null> {
		// const b = Buffer.alloc(1024)
		// b.writeUint8(0x03, 0)
		// b.writeUint8(0x1c, 1)
		// await this.device.write(b)
		// const device2Info = await this.device.getFeatureReport(0x0b, 512)
		// console.log('device2Info', device2Info)
		// // return this.#deviceInfo
		// // throw new Error('Method not implemented.')
		// // nocommit do properly
		// return parseDevice2Info(device2Info)
		return {
			productId: 0x0084,
			vendorId: 0x0fd9,
			serialNumber: 'abc',
			tcpPort: 1234,
			path: undefined,
		}
	}
}
