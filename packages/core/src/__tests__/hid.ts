import { EventEmitter } from 'eventemitter3'
import type { EncodeJPEGHelper } from '../models/base.js'
import type { HIDDevice, HIDDeviceEvents, HIDDeviceInfo } from '../hid-device.js'
export class DummyHID extends EventEmitter<HIDDeviceEvents> implements HIDDevice {
	constructor(
		public readonly path: string,
		public readonly encodeJPEG: jest.MockedFunction<EncodeJPEGHelper>,
	) {
		super()
		expect(typeof path).toEqual('string')
	}

	public async sendFeatureReport(_data: Uint8Array): Promise<void> {
		throw new Error('Method not implemented.')
	}
	public async getFeatureReport(_reportId: number, _reportLength: number): Promise<Uint8Array> {
		throw new Error('Method not implemented.')
	}
	public async sendReports(_data: Uint8Array[]): Promise<void> {
		throw new Error('Method not implemented.')
	}
	public async close(): Promise<void> {
		throw new Error('Not implemented')
	}
	public async getDeviceInfo(): Promise<HIDDeviceInfo> {
		throw new Error('Method not implemented.')
	}
}
