import EventEmitter from 'eventemitter3'
import { EncodeJPEGHelper } from '../models/base.js'
import { HIDDevice, HIDDeviceEvents, HIDDeviceInfo } from '../hid-device.js'
export class DummyHID extends EventEmitter<HIDDeviceEvents> implements HIDDevice {
	constructor(
		public readonly path: string,
		public readonly encodeJPEG: jest.MockedFunction<EncodeJPEGHelper>,
	) {
		super()
		expect(typeof path).toEqual('string')
	}

	public async sendFeatureReport(_data: Buffer): Promise<void> {
		throw new Error('Method not implemented.')
	}
	public async getFeatureReport(_reportId: number, _reportLength: number): Promise<Buffer> {
		throw new Error('Method not implemented.')
	}
	public async sendReports(_data: Buffer[]): Promise<void> {
		throw new Error('Method not implemented.')
	}
	public async close(): Promise<void> {
		throw new Error('Not implemented')
	}
	public async getDeviceInfo(): Promise<HIDDeviceInfo> {
		throw new Error('Method not implemented.')
	}
}
