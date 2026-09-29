import { DEVICE_MODELS2, DeviceModelId } from '@elgato-stream-deck/core'
import { StreamDeckTcpConnectionManager } from '../connectionManager.js'
import { CoraHidOp, CoraMessageFlags, SocketWrapper, type SocketCoraMessage } from '../socketWrapper.js'
import type { StreamDeckTcp } from '../types.js'
import { FakeSocket, createDevice2Info, createPrimaryDeviceInfo, type Device2InfoOptions } from './helpers.js'

jest.mock('../socketWrapper.js', () => ({
	...jest.requireActual('../socketWrapper.js'),
	SocketWrapper: jest.fn(),
}))

function getUsbIds(modelId: DeviceModelId): { vendorId: number; productId: number } {
	const model = DEVICE_MODELS2[modelId]
	return { vendorId: model.vendorId, productId: model.productIds[0] }
}

const STUDIO_USB = getUsbIds(DeviceModelId.STUDIO)
const XL_USB = getUsbIds(DeviceModelId.XL)

type SimulatedDevice =
	| {
			kind: 'primary'
			vendorId: number
			productId: number
			child?: Device2InfoOptions
			/** Responses to other host queries, by command type */
			reports?: Record<number, Buffer>
	  }
	| { kind: 'child'; vendorId: number; productId: number }

/**
 * A fake socket as created by the connection manager, which answers the queries the hid devices make
 */
class ManagedFakeSocket extends FakeSocket {
	override readonly address: string
	override readonly port: number

	isCora = false
	closed = false
	device: SimulatedDevice = { kind: 'primary', vendorId: STUDIO_USB.vendorId, productId: STUDIO_USB.productId }
	/** When false, queries are left unanswered */
	respond = true

	readonly checkForTimeout = jest.fn()

	constructor(address: string, port: number) {
		super()
		this.address = address
		this.port = port
		this.connected = false
	}

	/** Mimic the socket receiving its first keepalive */
	simulateConnect(): void {
		this.connected = true
		this.emit('connected', this.asSocketWrapper())
	}

	/** Mimic the socket being lost */
	simulateDisconnect(): void {
		this.connected = false
		this.emit('disconnected', this.asSocketWrapper())
	}

	/** Mimic the device sending an unsolicited report */
	simulateHostReport(data: Buffer): void {
		if (this.isCora) {
			this.emit('dataCora', {
				flags: CoraMessageFlags.RESULT,
				hidOp: CoraHidOp.GET_REPORT,
				messageId: 0,
				payload: data,
			})
		} else {
			this.emit('dataLegacy', data)
		}
	}

	async close(): Promise<void> {
		this.closed = true
		if (this.connected) {
			this.connected = false
			setImmediate(() => this.emit('disconnected', this.asSocketWrapper()))
		}
	}

	override sendLegacyWrites(buffers: Uint8Array[]): void {
		super.sendLegacyWrites(buffers)
		for (const buffer of buffers) {
			if (buffer[0] === 0x03) {
				this.#answerHostQuery(buffer[1])
			} else {
				this.#answerChildQuery(buffer[0])
			}
		}
	}

	override sendCoraWrites(messages: SocketCoraMessage[]): void {
		super.sendCoraWrites(messages)
		for (const message of messages) {
			if (message.hidOp !== CoraHidOp.GET_REPORT) continue
			if (message.flags & CoraMessageFlags.VERBATIM) {
				this.#answerChildQuery(message.payload[0])
			} else {
				this.#answerHostQuery(message.payload[1])
			}
		}
	}

	#reply(data: Buffer, fromChild: boolean): void {
		if (!this.respond) return
		setImmediate(() => {
			if (!this.connected) return
			if (this.isCora) {
				this.emit('dataCora', {
					flags: fromChild ? CoraMessageFlags.VERBATIM | CoraMessageFlags.RESULT : CoraMessageFlags.RESULT,
					hidOp: CoraHidOp.GET_REPORT,
					messageId: 0,
					payload: data,
				})
			} else {
				this.emit('dataLegacy', data)
			}
		})
	}

	#answerHostQuery(commandType: number): void {
		const device = this.device
		if (commandType === 0x80) {
			if (device.kind === 'primary')
				this.#reply(createPrimaryDeviceInfo(device.vendorId, device.productId), false)
		} else if (commandType === 0x1c) {
			const info: Device2InfoOptions =
				device.kind === 'child'
					? { connected: true, vendorId: device.vendorId, productId: device.productId }
					: (device.child ?? { connected: false })
			this.#reply(createDevice2Info(info), false)
		} else if (device.kind === 'primary' && device.reports?.[commandType]) {
			this.#reply(device.reports[commandType], false)
		}
	}

	#answerChildQuery(commandType: number): void {
		if (this.device.kind === 'child' && commandType === 0x08) {
			this.#reply(Buffer.from([0x08, 0, 0, 0]), true)
		}
	}
}

async function flushImmediates(count = 5): Promise<void> {
	for (let i = 0; i < count; i++) {
		await new Promise((resolve) => setImmediate(resolve))
	}
}

describe('StreamDeckTcpConnectionManager', () => {
	let sockets: ManagedFakeSocket[]
	let manager: StreamDeckTcpConnectionManager
	let errors: string[]

	function getSocket(address: string, port = 5343): ManagedFakeSocket {
		const socket = sockets.find((s) => s.address === address && s.port === port)
		if (!socket) throw new Error(`No socket for ${address}:${port}`)
		return socket
	}

	async function waitForConnected(): Promise<StreamDeckTcp> {
		return new Promise((resolve) => manager.once('connected', resolve))
	}

	beforeEach(() => {
		sockets = []
		jest.mocked(SocketWrapper).mockImplementation((address: string, port: number) => {
			const socket = new ManagedFakeSocket(address, port || 5343)
			sockets.push(socket)
			return socket.asSocketWrapper()
		})

		manager = new StreamDeckTcpConnectionManager()
		errors = []
		manager.on('error', (message) => errors.push(message))
	})

	afterEach(() => {
		manager.disconnectFromAll()
		jest.useRealTimers()
	})

	describe('connectTo', () => {
		test('creates a socket for the address', () => {
			manager.connectTo('10.0.0.1', 1234)

			expect(SocketWrapper).toHaveBeenCalledWith('10.0.0.1', 1234)
			expect(sockets).toHaveLength(1)
		})

		test('uses the default port', () => {
			manager.connectTo('10.0.0.1')

			expect(SocketWrapper).toHaveBeenCalledWith('10.0.0.1', 5343)
		})

		test('throws for a duplicate connection', () => {
			manager.connectTo('10.0.0.1')

			expect(() => manager.connectTo('10.0.0.1', 5343)).toThrow('Connection already exists')
			expect(sockets).toHaveLength(1)
		})

		test('allows another port on the same address', () => {
			manager.connectTo('10.0.0.1')
			manager.connectTo('10.0.0.1', 5344)

			expect(sockets).toHaveLength(2)
		})

		test('allows connecting again after disconnecting', () => {
			manager.connectTo('10.0.0.1')
			manager.disconnectFrom('10.0.0.1')
			manager.connectTo('10.0.0.1')

			expect(sockets).toHaveLength(2)
		})
	})

	describe('opening devices', () => {
		test('emits connected once the device is identified', async () => {
			manager.connectTo('10.0.0.1')
			const connected = waitForConnected()
			getSocket('10.0.0.1').simulateConnect()
			const streamdeck = await connected

			expect(streamdeck.MODEL).toBe(DeviceModelId.STUDIO)
			expect(streamdeck.remoteAddress).toBe('10.0.0.1')
			expect(streamdeck.remotePort).toBe(5343)
			expect(manager.getStreamdeckFor('10.0.0.1')).toBe(streamdeck)
			expect(errors).toEqual([])
		})

		test('does not report anything until the socket connects', async () => {
			const onConnected = jest.fn()
			manager.on('connected', onConnected)

			manager.connectTo('10.0.0.1')
			await flushImmediates()

			expect(onConnected).not.toHaveBeenCalled()
			expect(manager.getStreamdeckFor('10.0.0.1')).toBeUndefined()
		})

		test('uses the legacy protocol for legacy sockets', async () => {
			manager.connectTo('10.0.0.1')
			const socket = getSocket('10.0.0.1')
			const connected = waitForConnected()
			socket.simulateConnect()
			await connected

			expect(socket.sentLegacy.length).toBeGreaterThan(0)
			expect(socket.sentCora).toHaveLength(0)
		})

		test('uses the cora protocol for cora sockets', async () => {
			manager.connectTo('10.0.0.1')
			const socket = getSocket('10.0.0.1')
			socket.isCora = true
			const connected = waitForConnected()
			socket.simulateConnect()
			const streamdeck = await connected

			expect(streamdeck.MODEL).toBe(DeviceModelId.STUDIO)
			expect(socket.sentCora.length).toBeGreaterThan(0)
			expect(socket.sentLegacy).toHaveLength(0)
		})

		test('identifies a network dock by its fake product id', async () => {
			manager.connectTo('10.0.0.1')
			const socket = getSocket('10.0.0.1')
			socket.device = { kind: 'primary', vendorId: 0x0fd9, productId: 0xffff }
			const connected = waitForConnected()
			socket.simulateConnect()
			const streamdeck = await connected

			expect(streamdeck.MODEL).toBe(DeviceModelId.NETWORK_DOCK)
		})

		test('reports an unknown product', async () => {
			const onConnected = jest.fn()
			manager.on('connected', onConnected)

			manager.connectTo('10.0.0.1')
			const socket = getSocket('10.0.0.1')
			socket.device = { kind: 'primary', vendorId: 0x0fd9, productId: 0x1234 }
			socket.simulateConnect()
			await flushImmediates()

			expect(errors).toEqual(['Found StreamDeck with unknown productId: 1234'])
			expect(onConnected).not.toHaveBeenCalled()
			expect(manager.getStreamdeckFor('10.0.0.1')).toBeUndefined()
		})

		test('reports a failure to open the device', async () => {
			const onConnected = jest.fn()
			manager.on('connected', onConnected)

			manager.connectTo('10.0.0.1')
			const socket = getSocket('10.0.0.1')
			socket.respond = false
			socket.simulateConnect()
			await flushImmediates()
			socket.simulateDisconnect()
			await flushImmediates()

			expect(errors).toEqual(['Failed to open device 10.0.0.1:5343: Error: Disconnected'])
			expect(onConnected).not.toHaveBeenCalled()
		})
	})

	describe('disconnecting', () => {
		async function connectStudio(address = '10.0.0.1'): Promise<StreamDeckTcp> {
			manager.connectTo(address)
			const connected = waitForConnected()
			getSocket(address).simulateConnect()
			return connected
		}

		test('emits disconnected when the socket is lost', async () => {
			const streamdeck = await connectStudio()

			const onDisconnected = jest.fn()
			manager.on('disconnected', onDisconnected)

			getSocket('10.0.0.1').simulateDisconnect()
			await flushImmediates()

			expect(onDisconnected).toHaveBeenCalledTimes(1)
			expect(onDisconnected).toHaveBeenCalledWith(streamdeck)
			expect(manager.getStreamdeckFor('10.0.0.1')).toBeUndefined()
		})

		test('emits tcpEvents disconnected on the streamdeck', async () => {
			const streamdeck = await connectStudio()

			const onDisconnected = jest.fn()
			streamdeck.tcpEvents.on('disconnected', onDisconnected)

			getSocket('10.0.0.1').simulateDisconnect()
			await flushImmediates()

			expect(onDisconnected).toHaveBeenCalledTimes(1)
		})

		test('opens a new streamdeck when the socket reconnects', async () => {
			const first = await connectStudio()
			const socket = getSocket('10.0.0.1')

			socket.simulateDisconnect()
			await flushImmediates()

			const connected = waitForConnected()
			socket.simulateConnect()
			const second = await connected

			expect(second).not.toBe(first)
			expect(manager.getStreamdeckFor('10.0.0.1')).toBe(second)
		})

		test('does not emit disconnected for a device that never opened', async () => {
			const onDisconnected = jest.fn()
			manager.on('disconnected', onDisconnected)

			manager.connectTo('10.0.0.1')
			const socket = getSocket('10.0.0.1')
			socket.respond = false
			socket.simulateConnect()
			socket.simulateDisconnect()
			await flushImmediates()

			expect(onDisconnected).not.toHaveBeenCalled()
		})

		test('disconnectFrom closes the socket', async () => {
			const streamdeck = await connectStudio()

			const onDisconnected = jest.fn()
			manager.on('disconnected', onDisconnected)

			expect(manager.disconnectFrom('10.0.0.1')).toBe(true)
			expect(getSocket('10.0.0.1').closed).toBe(true)

			await flushImmediates()
			expect(onDisconnected).toHaveBeenCalledWith(streamdeck)
			expect(manager.getStreamdeckFor('10.0.0.1')).toBeUndefined()
		})

		test('disconnectFrom returns false for an unknown connection', () => {
			expect(manager.disconnectFrom('10.0.0.1')).toBe(false)
		})

		test('disconnectFromAll closes every socket', async () => {
			await connectStudio('10.0.0.1')
			await connectStudio('10.0.0.2')

			const onDisconnected = jest.fn()
			manager.on('disconnected', onDisconnected)

			manager.disconnectFromAll()

			expect(sockets.every((s) => s.closed)).toBe(true)
			await flushImmediates()
			expect(onDisconnected).toHaveBeenCalledTimes(2)
			expect(manager.getStreamdeckFor('10.0.0.1')).toBeUndefined()
			expect(manager.getStreamdeckFor('10.0.0.2')).toBeUndefined()
		})
	})

	describe('timeout checks', () => {
		test('checks every socket for a timeout each second', async () => {
			jest.useFakeTimers()

			manager.connectTo('10.0.0.1')
			manager.connectTo('10.0.0.2')

			await jest.advanceTimersByTimeAsync(3000)

			expect(getSocket('10.0.0.1').checkForTimeout).toHaveBeenCalledTimes(3)
			expect(getSocket('10.0.0.2').checkForTimeout).toHaveBeenCalledTimes(3)
		})

		test('stops checking once every connection is removed', async () => {
			jest.useFakeTimers()

			manager.connectTo('10.0.0.1')
			manager.connectTo('10.0.0.2')

			manager.disconnectFrom('10.0.0.1')
			expect(jest.getTimerCount()).toBe(1)

			manager.disconnectFrom('10.0.0.2')
			expect(jest.getTimerCount()).toBe(0)
		})

		test('stops checking after disconnectFromAll', () => {
			jest.useFakeTimers()

			manager.connectTo('10.0.0.1')
			manager.connectTo('10.0.0.2')
			manager.disconnectFromAll()

			expect(jest.getTimerCount()).toBe(0)
		})

		test('does not check removed sockets', async () => {
			jest.useFakeTimers()

			manager.connectTo('10.0.0.1')
			manager.connectTo('10.0.0.2')
			manager.disconnectFrom('10.0.0.1')

			await jest.advanceTimersByTimeAsync(2000)

			expect(getSocket('10.0.0.1').checkForTimeout).not.toHaveBeenCalled()
			expect(getSocket('10.0.0.2').checkForTimeout).toHaveBeenCalledTimes(2)
		})
	})

	describe('child devices', () => {
		const CHILD: Device2InfoOptions = {
			connected: true,
			vendorId: XL_USB.vendorId,
			productId: XL_USB.productId,
			serialNumber: 'CHILD1',
			tcpPort: 5344,
		}

		async function connectParent(child: Device2InfoOptions | undefined): Promise<StreamDeckTcp> {
			manager.connectTo('10.0.0.1')
			const socket = getSocket('10.0.0.1')
			socket.device = { kind: 'primary', vendorId: 0x0fd9, productId: 0xffff, child }
			const connected = waitForConnected()
			socket.simulateConnect()
			const parent = await connected
			await flushImmediates()
			return parent
		}

		function setupChildSocket(port: number): ManagedFakeSocket {
			const socket = getSocket('10.0.0.1', port)
			socket.device = { kind: 'child', vendorId: XL_USB.vendorId, productId: XL_USB.productId }
			return socket
		}

		test('connects to a child device on the same address', async () => {
			await connectParent(CHILD)

			expect(SocketWrapper).toHaveBeenCalledWith('10.0.0.1', 5344)

			const childSocket = setupChildSocket(5344)
			const connected = waitForConnected()
			childSocket.simulateConnect()
			const child = await connected

			expect(child.MODEL).toBe(DeviceModelId.XL)
			expect(child.remotePort).toBe(5344)
			expect(manager.getStreamdeckFor('10.0.0.1', 5344)).toBe(child)
		})

		test('does not connect when there is no child device', async () => {
			await connectParent(undefined)

			expect(sockets).toHaveLength(1)
		})

		test('does not connect when autoConnectToSecondaries is disabled', async () => {
			manager.disconnectFromAll()
			manager = new StreamDeckTcpConnectionManager({ autoConnectToSecondaries: false })
			manager.on('error', (message) => errors.push(message))

			await connectParent(CHILD)

			expect(sockets).toHaveLength(1)
		})

		test('does not look for children of a child device', async () => {
			await connectParent(CHILD)
			const childSocket = setupChildSocket(5344)
			const connected = waitForConnected()
			childSocket.simulateConnect()
			await connected
			await flushImmediates()

			expect(sockets).toHaveLength(2)
		})

		test('emits childChange on the parent when a child is plugged in', async () => {
			const parent = await connectParent(undefined)

			const onChildChange = jest.fn()
			parent.tcpEvents.on('childChange', onChildChange)

			getSocket('10.0.0.1').simulateHostReport(createDevice2Info(CHILD))

			expect(onChildChange).toHaveBeenCalledTimes(1)
			expect(onChildChange.mock.calls[0][0]).toMatchObject({ tcpPort: 5344, serialNumber: 'CHILD1' })
		})

		test('connects when a child is plugged in later', async () => {
			await connectParent(undefined)

			getSocket('10.0.0.1').simulateHostReport(createDevice2Info(CHILD))

			expect(SocketWrapper).toHaveBeenCalledWith('10.0.0.1', 5344)
		})

		test('disconnects when the child is unplugged', async () => {
			await connectParent(CHILD)
			const childSocket = setupChildSocket(5344)

			getSocket('10.0.0.1').simulateHostReport(createDevice2Info({ connected: false }))

			expect(childSocket.closed).toBe(true)
		})

		test('replaces the child connection when the port changes', async () => {
			await connectParent(CHILD)
			const oldChildSocket = setupChildSocket(5344)

			getSocket('10.0.0.1').simulateHostReport(createDevice2Info({ ...CHILD, tcpPort: 5345 }))

			expect(oldChildSocket.closed).toBe(true)
			expect(SocketWrapper).toHaveBeenCalledWith('10.0.0.1', 5345)
		})

		test('keeps the child connection for a repeated plug event', async () => {
			await connectParent(CHILD)

			getSocket('10.0.0.1').simulateHostReport(createDevice2Info(CHILD))

			expect(sockets).toHaveLength(2)
			expect(setupChildSocket(5344).closed).toBe(false)
		})

		test('keeps the child connection when the parent reconnects', async () => {
			await connectParent(CHILD)
			const parentSocket = getSocket('10.0.0.1')
			const childSocket = setupChildSocket(5344)

			parentSocket.simulateDisconnect()
			await flushImmediates()
			const connected = waitForConnected()
			parentSocket.simulateConnect()
			await connected
			await flushImmediates()

			expect(sockets).toHaveLength(2)
			expect(childSocket.closed).toBe(false)
		})

		test('disconnecting the parent also disconnects the child', async () => {
			await connectParent(CHILD)
			const childSocket = setupChildSocket(5344)

			manager.disconnectFrom('10.0.0.1')

			expect(childSocket.closed).toBe(true)
			expect(getSocket('10.0.0.1').closed).toBe(true)
		})

		test('ignores child changes from a parent that has been replaced', async () => {
			const oldParent = await connectParent(undefined)
			const parentSocket = getSocket('10.0.0.1')

			parentSocket.simulateDisconnect()
			await flushImmediates()
			const connected = waitForConnected()
			parentSocket.simulateConnect()
			await connected
			await flushImmediates()

			oldParent.tcpEvents.emit('childChange', { ...CHILD, path: undefined } as any)

			expect(sockets).toHaveLength(1)
		})
	})

	describe('tcp properties', () => {
		async function connectStudio(reports: Record<number, Buffer> = {}): Promise<StreamDeckTcp> {
			manager.connectTo('10.0.0.1')
			const socket = getSocket('10.0.0.1')
			socket.device = { kind: 'primary', vendorId: STUDIO_USB.vendorId, productId: STUDIO_USB.productId, reports }
			const connected = waitForConnected()
			socket.simulateConnect()
			return connected
		}

		function lastSent(): Buffer {
			const socket = getSocket('10.0.0.1')
			return Buffer.from(socket.sentLegacy[socket.sentLegacy.length - 1])
		}

		test('setBrightness sends the brightness report', async () => {
			const streamdeck = await connectStudio()

			await streamdeck.setBrightness(42)

			const expected = Buffer.alloc(1024)
			expected.set([0x03, 0x08, 42])
			expect(lastSent()).toEqual(expected)
		})

		test.each([-1, 101])('setBrightness rejects %d', async (percentage) => {
			const streamdeck = await connectStudio()
			const sentCount = getSocket('10.0.0.1').sentLegacy.length

			await expect(streamdeck.setBrightness(percentage)).rejects.toThrow(RangeError)
			expect(getSocket('10.0.0.1').sentLegacy).toHaveLength(sentCount)
		})

		test('resetToLogo is not implemented', async () => {
			const streamdeck = await connectStudio()

			await expect(streamdeck.resetToLogo()).rejects.toThrow('Not implemented')
		})

		test('getFirmwareVersion reads report 0x83', async () => {
			const report = Buffer.alloc(32)
			report.set([0x03, 0x83])
			report.write('1.00.012', 8, 'ascii')
			const streamdeck = await connectStudio({ 0x83: report })

			await expect(streamdeck.getFirmwareVersion()).resolves.toBe('1.00.012')
		})

		test('getSerialNumber reads report 0x84', async () => {
			const report = Buffer.alloc(32)
			report.set([0x03, 0x84, 0, 6])
			report.write('ABC123XYZ', 4, 'ascii')
			const streamdeck = await connectStudio({ 0x84: report })

			await expect(streamdeck.getSerialNumber()).resolves.toBe('ABC123')
		})

		test('getAllFirmwareVersions reads the version reports', async () => {
			const ap2 = Buffer.alloc(32)
			ap2.set([0x03, 0x83])
			ap2.writeUInt32BE(0xdeadbeef, 4)
			ap2.write('1.00.012', 8, 'ascii')
			const encoderAp2 = Buffer.from([0x03, 0x86, 0x00])
			const encoderLd = Buffer.from([0x03, 0x8a, 0x00])
			const streamdeck = await connectStudio({ 0x83: ap2, 0x86: encoderAp2, 0x8a: encoderLd })

			await expect(streamdeck.getAllFirmwareVersions()).resolves.toEqual({
				AP2: '1.00.012',
				AP2_CHECKSUM: 'deadbeef',
			})
		})
	})
})
