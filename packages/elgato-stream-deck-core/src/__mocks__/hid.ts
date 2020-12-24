import { EventEmitter } from 'events'
import type { HID } from 'node-hid'
export class DummyHID extends EventEmitter implements HID {
	public path: string

	constructor(devicePath: string) {
		super()
		expect(typeof devicePath).toEqual('string')
		this.path = devicePath
	}
	public close(): void {
		throw new Error('Not implemented')
	}
	public pause(): void {
		throw new Error('Not implemented')
	}
	public read(_callback: (err: any, data: number[]) => void): void {
		throw new Error('Not implemented')
	}
	public readSync(): number[] {
		throw new Error('Not implemented')
	}
	public readTimeout(_timeOut: number): number[] {
		throw new Error('Not implemented')
	}
	public sendFeatureReport(_data: number[]): number {
		throw new Error('Not implemented')
	}
	public getFeatureReport(_reportId: number, _reportLength: number): number[] {
		throw new Error('Not implemented')
	}
	public resume(): void {
		throw new Error('Not implemented')
	}
	// on (event: string, handler: (value: any) => void) {
	// 	throw new Error('Not implemented')
	// }
	public write(_values: number[]): number {
		throw new Error('Not implemented')
	}
	public setDriverType(_type: string): void {
		throw new Error('Not implemented')
	}
	public setNonBlocking(_no_block: boolean): void {
		throw new Error('Method not implemented.')
	}
}
