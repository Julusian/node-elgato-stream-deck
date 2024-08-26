import { EventEmitter } from 'events'
import type { Device, HIDAsync } from 'node-hid'
export class DummyHID extends EventEmitter implements HIDAsync {
	constructor() {
		super()
	}
	public async close(): Promise<void> {
		throw new Error('Not implemented')
	}
	public pause(): void {
		throw new Error('Not implemented')
	}
	public async read(): Promise<Buffer | undefined> {
		throw new Error('Not implemented')
	}
	public async sendFeatureReport(_data: number[]): Promise<number> {
		throw new Error('Not implemented')
	}
	public async getFeatureReport(_reportId: number, _reportLength: number): Promise<Buffer> {
		throw new Error('Not implemented')
	}
	public resume(): void {
		throw new Error('Not implemented')
	}
	// on (event: string, handler: (value: any) => void) {
	// 	throw new Error('Not implemented')
	// }
	public async write(_values: number[]): Promise<number> {
		throw new Error('Not implemented')
	}
	public setDriverType(_type: string): void {
		throw new Error('Not implemented')
	}
	public async setNonBlocking(_no_block: boolean): Promise<void> {
		throw new Error('Method not implemented.')
	}

	public getDeviceInfo = jest.fn(async (): Promise<Device> => {
		throw new Error('Not implemented')
	})
}
