import { EventEmitter } from 'events'
import type { StreamDeck } from '@elgato-stream-deck/core'
import { StreamDeckTcpWrapper } from '../tcpWrapper.js'
import type { TcpHidDevice } from '../hid-device/api.js'
import { FakeSocket } from './helpers.js'

class FakeTcpHidDevice extends EventEmitter {
	isPrimary = true
	onChildInfoChange: ((info: any) => void) | null = null
	readonly getFeatureReport = jest.fn<Promise<Uint8Array>, [number, number]>()

	asTcpHidDevice(): TcpHidDevice {
		return this as unknown as TcpHidDevice
	}
}

async function flushImmediates(): Promise<void> {
	return new Promise((resolve) => setImmediate(resolve))
}

describe('StreamDeckTcpWrapper', () => {
	let socket: FakeSocket
	let device: FakeTcpHidDevice
	let streamdeck: { MODEL: string; close: jest.Mock }

	beforeEach(() => {
		socket = new FakeSocket()
		device = new FakeTcpHidDevice()
		streamdeck = { MODEL: 'studio', close: jest.fn(async () => undefined) }
	})

	function createWrapper(): StreamDeckTcpWrapper {
		return new StreamDeckTcpWrapper(
			socket.asSocketWrapper(),
			device.asTcpHidDevice(),
			streamdeck as unknown as StreamDeck,
		)
	}

	test('exposes the remote address and port', () => {
		const wrapper = createWrapper()

		expect(wrapper.remoteAddress).toBe('10.0.0.1')
		expect(wrapper.remotePort).toBe(5343)
	})

	test('proxies the streamdeck', async () => {
		const wrapper = createWrapper()

		expect(wrapper.MODEL).toBe('studio')
		await wrapper.close()
		expect(streamdeck.close).toHaveBeenCalledTimes(1)
	})

	test('emits tcpEvents disconnected when the socket disconnects', async () => {
		const wrapper = createWrapper()
		const onDisconnected = jest.fn()
		wrapper.tcpEvents.on('disconnected', onDisconnected)

		socket.emit('disconnected', socket.asSocketWrapper())
		expect(onDisconnected).not.toHaveBeenCalled()

		await flushImmediates()
		expect(onDisconnected).toHaveBeenCalledTimes(1)
	})

	describe('childChange', () => {
		test('forwards child info changes for a primary device', () => {
			const wrapper = createWrapper()
			const onChildChange = jest.fn()
			wrapper.tcpEvents.on('childChange', onChildChange)

			const info = { vendorId: 1, productId: 2, serialNumber: 'X', tcpPort: 5344, path: undefined }
			device.onChildInfoChange?.(info)
			device.onChildInfoChange?.(null)

			expect(onChildChange.mock.calls).toEqual([[info], [null]])
		})

		test('does not listen for child changes on a secondary device', () => {
			device.isPrimary = false
			createWrapper()

			expect(device.onChildInfoChange).toBeNull()
		})
	})

	describe('getMacAddress', () => {
		test('formats report 0x85 as a mac address', async () => {
			const report = new Uint8Array(16)
			report.set([0x03, 0x85, 0, 0, 0x00, 0x1a, 0x2b, 0x3c, 0x4d, 0xef, 0xff])
			device.getFeatureReport.mockResolvedValueOnce(report)

			await expect(createWrapper().getMacAddress()).resolves.toBe('00:1a:2b:3c:4d:ef')
			expect(device.getFeatureReport).toHaveBeenCalledWith(0x85, -1)
		})

		test('rejects on a secondary device', async () => {
			device.isPrimary = false

			await expect(createWrapper().getMacAddress()).rejects.toThrow('Not supported on secondary devices')
			expect(device.getFeatureReport).not.toHaveBeenCalled()
		})

		test('passes through query failures', async () => {
			device.getFeatureReport.mockRejectedValueOnce(new Error('Timeout'))

			await expect(createWrapper().getMacAddress()).rejects.toThrow('Timeout')
		})
	})
})
