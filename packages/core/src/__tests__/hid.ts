import { EventEmitter } from 'events'
import { EncodeJPEGHelper } from '../models/base'
import { HIDDevice } from '../device'
export class DummyHID extends EventEmitter implements HIDDevice {
	public dataKeyOffset?: number | undefined

	constructor(public readonly path: string, public readonly encodeJPEG: jest.MockedFunction<EncodeJPEGHelper>) {
		super()
		expect(typeof path).toEqual('string')
	}

	public sendFeatureReport(_data: Buffer): Promise<void> {
		throw new Error('Method not implemented.')
	}
	public getFeatureReport(_reportId: number, _reportLength: number): Promise<Buffer> {
		throw new Error('Method not implemented.')
	}
	public sendReport(_data: Buffer): Promise<void> {
		throw new Error('Method not implemented.')
	}
	public close(): Promise<void> {
		throw new Error('Not implemented')
	}
}
