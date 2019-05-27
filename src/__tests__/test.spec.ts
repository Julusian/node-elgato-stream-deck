import { EventEmitter } from 'events'
import { mocked } from 'ts-jest/utils'

import { validateWriteCall } from './helpers'

// test.js
jest.mock('node-hid')
// const HID = require('node-hid')
import { HID, devices } from 'node-hid'
mocked(devices).mockImplementation(() => [{
	vendorId: 0x0fd9,
	productId: 0x0060,
	path: 'some_random_path_here',
	release: 0,
	interface: 0
}])

class DummyHID extends EventEmitter {
	path: string

	constructor (devicePath: string) {
		super()
		expect(typeof devicePath).toEqual('string')
		this.path = devicePath
		// this.write = jest.fn()
		// this.sendFeatureReport = jest.fn()
	}

	close () {
		throw new Error('Not implemented')
	}
	pause () {
		throw new Error('Not implemented')
	}
	read (_callback: (err: any, data: number[]) => void) {
		throw new Error('Not implemented')
	}
	readSync (): number[] {
		throw new Error('Not implemented')
	}
	readTimeout (_timeOut: number): number[] {
		throw new Error('Not implemented')
	}
	sendFeatureReport (_data: number[]): number {
		throw new Error('Not implemented')
	}
	getFeatureReport (_reportId: number, _reportLength: number): number[] {
		throw new Error('Not implemented')
	}
	resume () {
		throw new Error('Not implemented')
	}
	// on (event: string, handler: (value: any) => void) {
	// 	throw new Error('Not implemented')
	// }
	write (_values: number[]): number {
		throw new Error('Not implemented')
	}
	setDriverType (_type: string): void {
		throw new Error('Not implemented')
	}
}
// Forcing path to be string, as there are multiple constructor options, we require the string one
mocked(HID).mockImplementation((path: any) => new DummyHID(path))

// Must be required after we register a mock for `node-hid`.
// import StreamDeck from '../'
const StreamDeck = require('../')

describe('StreamDeck', () => {
	let streamDeck: StreamDeck
	function getDevice (sd?: StreamDeck): DummyHID {
		return (sd || streamDeck as any).device
	}

	beforeEach(() => {
		streamDeck = new StreamDeck()
	})

	test('constructor uses the provided devicePath', () => {
		const devicePath = 'some_random_path_here'
		const streamDeck = new StreamDeck(devicePath)
		const device = getDevice(streamDeck)
		expect(device.path).toEqual(devicePath)
	})

	test('errors if no devicePath is provided and there are no connected Stream Decks', () => {
		mocked(devices).mockImplementationOnce(() => [])
		expect(() => new StreamDeck()).toThrowError(new Error('No Stream Decks are connected.'))
	})

	test('fillColor', () => {
		const device = getDevice()
		device.write = jest.fn()
		expect(device.write).toHaveBeenCalledTimes(0)
		streamDeck.fillColor(0, 255, 0, 0)

		validateWriteCall(device.write, [
			'fillColor-red-page1.json',
			'fillColor-red-page2.json'
		])
	})

	test('checkRGBValue', () => {
		expect(() => streamDeck.fillColor(0, 256, 0, 0)).toThrow()
		expect(() => streamDeck.fillColor(0, 0, 256, 0)).toThrow()
		expect(() => streamDeck.fillColor(0, 0, 0, 256)).toThrow()
		expect(() => streamDeck.fillColor(0, -1, 0, 0)).toThrow()
	})

	test('checkValidKeyIndex', () => {
		expect(() => streamDeck.clearKey(-1)).toThrow()
		expect(() => streamDeck.clearKey(15)).toThrow()
	})

	test('clearKey', () => {
		streamDeck.fillColor = jest.fn()
		streamDeck.clearKey(0)
		expect(streamDeck.fillColor).toHaveBeenCalledTimes(1)
		expect(streamDeck.fillColor).toHaveBeenNthCalledWith(1, 0, 0, 0, 0)
	})

	test('clearAllKeys', () => {
		streamDeck.clearKey = jest.fn()
		streamDeck.clearAllKeys()

		expect(streamDeck.clearKey).toHaveBeenCalledTimes(15)
		for (let i = 0; i < 15; i++) {
			expect(streamDeck.clearKey).toHaveBeenNthCalledWith(i + 1, i)
		}
	})

	test('down and up events', () => {
		const downSpy = jest.fn()
		const upSpy = jest.fn()
		streamDeck.on('down', downSpy)
		streamDeck.on('up', upSpy)

		const device = getDevice()
		device.emit('data', Buffer.from([0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))
		device.emit('data', Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))

		expect(downSpy).toHaveBeenCalledTimes(1)
		expect(upSpy).toHaveBeenCalledTimes(1)
		expect(downSpy).toHaveBeenNthCalledWith(1, 0)
		expect(upSpy).toHaveBeenNthCalledWith(1, 0)
	})

	test('forwards error events from the device', () => {
		const errorSpy = jest.fn()
		streamDeck.on('error', errorSpy)

		const device = getDevice()
		device.emit('error', new Error('Test'))

		expect(errorSpy).toHaveBeenCalledTimes(1)
		expect(errorSpy).toHaveBeenNthCalledWith(1, new Error('Test'))
	})

	test('fillImage throws on undersized buffers', () => {
		const smallBuffer = Buffer.alloc(1)

		expect(() => streamDeck.fillImage(0, smallBuffer)).toThrow()
	})

	test('setBrightness', () => {
		const device = getDevice()
		device.sendFeatureReport = jest.fn()

		streamDeck.setBrightness(100)
		streamDeck.setBrightness(0)

		expect(device.sendFeatureReport).toHaveBeenCalledTimes(2)
		expect(device.sendFeatureReport).toHaveBeenNthCalledWith(1, [0x05, 0x55, 0xaa, 0xd1, 0x01, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
		expect(device.sendFeatureReport).toHaveBeenNthCalledWith(2, [0x05, 0x55, 0xaa, 0xd1, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])

		expect(() => streamDeck.setBrightness(101)).toThrow()
		expect(() => streamDeck.setBrightness(-1)).toThrow()
	})
})
