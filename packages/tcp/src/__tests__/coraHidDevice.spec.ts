import { TcpCoraHidDevice } from '../hid-device/cora.js'
import { CoraHidOp, CoraMessageFlags, type SocketCoraMessage } from '../socketWrapper.js'
import { FakeSocket, createDevice2Info, createPrimaryDeviceInfo } from './helpers.js'

/** A response from the primary (host) device, which echoes the command type in the second byte */
function hostResponse(payload: Buffer): SocketCoraMessage {
	return { flags: CoraMessageFlags.RESULT, hidOp: CoraHidOp.GET_REPORT, messageId: 0, payload }
}

/** A response from the child device, which echoes the command type in the first byte */
function childResponse(payload: Buffer): SocketCoraMessage {
	return {
		flags: CoraMessageFlags.VERBATIM | CoraMessageFlags.RESULT,
		hidOp: CoraHidOp.GET_REPORT,
		messageId: 0,
		payload,
	}
}

async function flushImmediates(): Promise<void> {
	return new Promise((resolve) => setImmediate(resolve))
}

describe('TcpCoraHidDevice', () => {
	let socket: FakeSocket
	let device: TcpCoraHidDevice

	beforeEach(() => {
		socket = new FakeSocket()
		device = new TcpCoraHidDevice(socket.asSocketWrapper())
	})

	afterEach(() => {
		// Reject anything still pending, so no timers are left running
		socket.emit('disconnected', socket.asSocketWrapper())
		jest.useRealTimers()
	})

	test('close throws, as the socket is owned by the connection manager', async () => {
		await expect(device.close()).rejects.toThrow('Socket is owned by the connection manager')
	})

	describe('writes', () => {
		test('sendFeatureReport sends a verbatim SEND_REPORT', async () => {
			await device.sendFeatureReport(new Uint8Array([0x03, 0x08, 50]))

			expect(socket.sentCora).toEqual([
				{
					flags: CoraMessageFlags.VERBATIM,
					hidOp: CoraHidOp.SEND_REPORT,
					messageId: 0,
					payload: Buffer.from([0x03, 0x08, 50]),
				},
			])
		})

		test('sendFeatureReport respects the view into a larger buffer', async () => {
			const backing = new Uint8Array([9, 9, 1, 2, 3, 9])
			await device.sendFeatureReport(backing.subarray(2, 5))

			expect(socket.sentCora[0].payload).toEqual(Buffer.from([1, 2, 3]))
		})

		test('sendReports sends each buffer as a verbatim WRITE', async () => {
			await device.sendReports([Buffer.from([1]), Buffer.from([2, 2])])

			expect(socket.sentCora).toEqual([
				{ flags: CoraMessageFlags.VERBATIM, hidOp: CoraHidOp.WRITE, messageId: 0, payload: Buffer.from([1]) },
				{
					flags: CoraMessageFlags.VERBATIM,
					hidOp: CoraHidOp.WRITE,
					messageId: 0,
					payload: Buffer.from([2, 2]),
				},
			])
		})
	})

	describe('input', () => {
		test('emits input reports without the report id', () => {
			const onInput = jest.fn()
			device.on('input', onInput)

			socket.emit('dataCora', hostResponse(Buffer.from([0x01, 0x00, 0x05, 0x00, 0x01])))

			expect(onInput).toHaveBeenCalledTimes(1)
			expect(onInput.mock.calls[0][0]).toEqual(Buffer.from([0x00, 0x05, 0x00, 0x01]))
		})

		test('forwards socket errors', () => {
			const onError = jest.fn()
			device.on('error', onError)

			socket.emit('error', 'socket error', new Error('boom'))

			expect(onError).toHaveBeenCalledWith('Socket error: socket error (boom)')
		})
	})

	describe('getFeatureReport', () => {
		test('queries the host and resolves with the response', async () => {
			const promise = device.getFeatureReport(0x83, -1)

			expect(socket.sentCora).toHaveLength(1)
			expect(socket.sentCora[0]).toMatchObject({
				flags: CoraMessageFlags.NONE,
				hidOp: CoraHidOp.GET_REPORT,
				payload: Buffer.from([0x03, 0x83]),
			})

			const response = Buffer.from([0x03, 0x83, 1, 2, 3])
			socket.emit('dataCora', hostResponse(response))

			await expect(promise).resolves.toEqual(response)
		})

		test('ignores responses for other commands', async () => {
			const promise = device.getFeatureReport(0x83, -1)
			let settled = false
			promise.finally(() => (settled = true)).catch(() => null)

			socket.emit('dataCora', hostResponse(Buffer.from([0x03, 0x84])))
			await flushImmediates()
			expect(settled).toBe(false)

			socket.emit('dataCora', hostResponse(Buffer.from([0x03, 0x83])))
			await expect(promise).resolves.toEqual(Buffer.from([0x03, 0x83]))
		})

		test('shares a pending query for the same report', async () => {
			const first = device.getFeatureReport(0x83, -1)
			const second = device.getFeatureReport(0x83, -1)

			// Only one query should be sent, as the response can't be matched to a specific request
			expect(socket.sentCora).toHaveLength(1)

			const response = Buffer.from([0x03, 0x83, 7])
			socket.emit('dataCora', hostResponse(response))

			await expect(first).resolves.toEqual(response)
			await expect(second).resolves.toEqual(response)
		})

		test('can repeat a query once the previous one has completed', async () => {
			const first = device.getFeatureReport(0x83, -1)
			socket.emit('dataCora', hostResponse(Buffer.from([0x03, 0x83, 1])))
			await first

			const second = device.getFeatureReport(0x83, -1)
			expect(socket.sentCora).toHaveLength(2)
			socket.emit('dataCora', hostResponse(Buffer.from([0x03, 0x83, 2])))
			await expect(second).resolves.toEqual(Buffer.from([0x03, 0x83, 2]))
		})

		test('rejects after a timeout', async () => {
			jest.useFakeTimers()

			const promise = device.getFeatureReport(0x83, -1)
			const assertion = expect(promise).rejects.toThrow('Timeout')

			await jest.advanceTimersByTimeAsync(5000)
			await assertion
		})

		test('can retry after a timeout', async () => {
			jest.useFakeTimers()

			const first = device.getFeatureReport(0x83, -1)
			const assertion = expect(first).rejects.toThrow('Timeout')
			await jest.advanceTimersByTimeAsync(5000)
			await assertion

			const second = device.getFeatureReport(0x83, -1)
			expect(socket.sentCora).toHaveLength(2)
			socket.emit('dataCora', hostResponse(Buffer.from([0x03, 0x83])))
			await jest.advanceTimersByTimeAsync(0)
			await expect(second).resolves.toEqual(Buffer.from([0x03, 0x83]))
		})

		test('does not leave a timer running once resolved', async () => {
			jest.useFakeTimers()

			const promise = device.getFeatureReport(0x83, -1)
			socket.emit('dataCora', hostResponse(Buffer.from([0x03, 0x83])))
			await jest.advanceTimersByTimeAsync(0)
			await promise

			expect(jest.getTimerCount()).toBe(0)
		})

		test('rejects and cleans up when the write fails', async () => {
			jest.useFakeTimers()

			const failure = new Error('write failed')
			const send = jest.spyOn(socket, 'sendCoraWrites').mockImplementationOnce(() => {
				throw failure
			})

			await expect(device.getFeatureReport(0x83, -1)).rejects.toBe(failure)
			expect(jest.getTimerCount()).toBe(0)

			// A later query must not be attached to the failed one
			send.mockRestore()
			const promise = device.getFeatureReport(0x83, -1)
			expect(socket.sentCora).toHaveLength(1)
			socket.emit('disconnected', socket.asSocketWrapper())
			await expect(promise).rejects.toThrow('Disconnected')
		})

		test('rejects pending queries on disconnect', async () => {
			const first = device.getFeatureReport(0x83, -1)
			const second = device.getFeatureReport(0x84, -1)

			socket.emit('disconnected', socket.asSocketWrapper())

			await expect(first).rejects.toThrow('Disconnected')
			await expect(second).rejects.toThrow('Disconnected')
		})

		test('does not leave a timer running once disconnected', async () => {
			jest.useFakeTimers()

			const promise = device.getFeatureReport(0x83, -1)
			socket.emit('disconnected', socket.asSocketWrapper())
			await expect(promise).rejects.toThrow('Disconnected')

			expect(jest.getTimerCount()).toBe(0)
		})
	})

	describe('disconnected', () => {
		beforeEach(() => {
			socket.emit('disconnected', socket.asSocketWrapper())
		})

		test('sendFeatureReport rejects without writing', async () => {
			await expect(device.sendFeatureReport(new Uint8Array([1]))).rejects.toThrow('Disconnected')
			expect(socket.sentCora).toHaveLength(0)
		})

		test('sendReports rejects without writing', async () => {
			await expect(device.sendReports([Buffer.from([1])])).rejects.toThrow('Disconnected')
			expect(socket.sentCora).toHaveLength(0)
		})

		test('getFeatureReport rejects without writing', async () => {
			await expect(device.getFeatureReport(0x83, -1)).rejects.toThrow('Disconnected')
			expect(socket.sentCora).toHaveLength(0)
		})

		test('stays disconnected when the socket reconnects', async () => {
			socket.emit('connected', socket.asSocketWrapper())

			await expect(device.sendReports([Buffer.from([1])])).rejects.toThrow('Disconnected')
			expect(socket.sentCora).toHaveLength(0)
		})
	})

	test('starts disconnected if the socket is not connected', async () => {
		const disconnectedSocket = new FakeSocket()
		disconnectedSocket.connected = false
		const disconnectedDevice = new TcpCoraHidDevice(disconnectedSocket.asSocketWrapper())

		await expect(disconnectedDevice.sendReports([Buffer.from([1])])).rejects.toThrow('Disconnected')
		expect(disconnectedSocket.sentCora).toHaveLength(0)
	})

	describe('getDeviceInfo', () => {
		test('identifies a primary device', async () => {
			const promise = device.getDeviceInfo()

			// It probes both the primary and the child protocols
			expect(socket.sentCora.map((msg) => [msg.flags, [...msg.payload]])).toEqual([
				[CoraMessageFlags.NONE, [0x03, 0x80]],
				[CoraMessageFlags.VERBATIM, [0x08]],
				[CoraMessageFlags.VERBATIM, [0xa1]],
			])

			socket.emit('dataCora', hostResponse(createPrimaryDeviceInfo(0x0fd9, 0x00aa)))

			await expect(promise).resolves.toEqual({
				vendorId: 0x0fd9,
				productId: 0x00aa,
				path: 'tcp://10.0.0.1:5343',
			})
			expect(device.isPrimary).toBe(true)
		})

		test('caches the result', async () => {
			const promise = device.getDeviceInfo()
			socket.emit('dataCora', hostResponse(createPrimaryDeviceInfo(0x0fd9, 0x00aa)))
			const info = await promise

			const sentCount = socket.sentCora.length
			await expect(device.getDeviceInfo()).resolves.toBe(info)
			expect(socket.sentCora).toHaveLength(sentCount)
		})

		test.each([
			['general protocol', 0x08],
			['mini protocol', 0xa1],
		])('identifies a child device using the %s', async (_name, commandType) => {
			const promise = device.getDeviceInfo()

			socket.emit('dataCora', childResponse(Buffer.from([commandType, 1, 2, 3])))
			await flushImmediates()
			await flushImmediates()

			// It then asks the host what the child device is
			const lastSent = socket.sentCora[socket.sentCora.length - 1]
			expect(lastSent).toMatchObject({ flags: CoraMessageFlags.NONE, payload: Buffer.from([0x03, 0x1c]) })

			socket.emit(
				'dataCora',
				hostResponse(createDevice2Info({ connected: true, vendorId: 0x0fd9, productId: 0x0063 })),
			)

			await expect(promise).resolves.toEqual({
				vendorId: 0x0fd9,
				productId: 0x0063,
				path: 'tcp://10.0.0.1:5343',
			})
			expect(device.isPrimary).toBe(false)
		})

		test('rejects when the child device is not connected', async () => {
			const promise = device.getDeviceInfo()

			socket.emit('dataCora', childResponse(Buffer.from([0x08])))
			await flushImmediates()
			await flushImmediates()
			socket.emit('dataCora', hostResponse(createDevice2Info({ connected: false })))

			await expect(promise).rejects.toThrow('Failed to get Device info')
		})

		test('rejects when disconnected', async () => {
			const promise = device.getDeviceInfo()
			socket.emit('disconnected', socket.asSocketWrapper())

			await expect(promise).rejects.toThrow('Disconnected')
		})
	})

	describe('child devices', () => {
		async function identifyAsPrimary(): Promise<void> {
			const promise = device.getDeviceInfo()
			socket.emit('dataCora', hostResponse(createPrimaryDeviceInfo(0x0fd9, 0x00aa)))
			await promise
		}

		test('getChildDeviceInfo returns the connected child', async () => {
			await identifyAsPrimary()

			const promise = device.getChildDeviceInfo()
			expect(socket.sentCora[socket.sentCora.length - 1].payload).toEqual(Buffer.from([0x03, 0x1c]))

			socket.emit(
				'dataCora',
				hostResponse(
					createDevice2Info({
						connected: true,
						vendorId: 0x0fd9,
						productId: 0x0063,
						serialNumber: 'ABC123',
						tcpPort: 5344,
					}),
				),
			)

			await expect(promise).resolves.toEqual({
				vendorId: 0x0fd9,
				productId: 0x0063,
				serialNumber: 'ABC123',
				tcpPort: 5344,
				path: undefined,
			})
		})

		test('getChildDeviceInfo returns null when nothing is connected', async () => {
			await identifyAsPrimary()

			const promise = device.getChildDeviceInfo()
			socket.emit('dataCora', hostResponse(createDevice2Info({ connected: false })))

			await expect(promise).resolves.toBeNull()
		})

		test('getChildDeviceInfo returns null for a child device', async () => {
			const promise = device.getDeviceInfo()
			socket.emit('dataCora', childResponse(Buffer.from([0x08])))
			await flushImmediates()
			await flushImmediates()
			socket.emit('dataCora', hostResponse(createDevice2Info({ connected: true, vendorId: 1, productId: 2 })))
			await promise

			const sentCount = socket.sentCora.length
			await expect(device.getChildDeviceInfo()).resolves.toBeNull()
			expect(socket.sentCora).toHaveLength(sentCount)
		})

		test('reports unsolicited plug events', () => {
			const onChange = jest.fn()
			device.onChildInfoChange = onChange

			socket.emit(
				'dataCora',
				hostResponse(
					createDevice2Info({ connected: true, vendorId: 0x0fd9, productId: 0x0063, tcpPort: 5344 }),
				),
			)
			socket.emit('dataCora', hostResponse(createDevice2Info({ connected: false })))

			expect(onChange).toHaveBeenCalledTimes(2)
			expect(onChange.mock.calls[0][0]).toMatchObject({ vendorId: 0x0fd9, productId: 0x0063, tcpPort: 5344 })
			expect(onChange.mock.calls[1][0]).toBeNull()
		})

		test('does not report a solicited query as a plug event', async () => {
			await identifyAsPrimary()

			const onChange = jest.fn()
			device.onChildInfoChange = onChange

			const promise = device.getChildDeviceInfo()
			socket.emit('dataCora', hostResponse(createDevice2Info({ connected: false })))
			await promise

			expect(onChange).not.toHaveBeenCalled()
		})
	})
})
