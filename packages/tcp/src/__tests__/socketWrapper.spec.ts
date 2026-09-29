import * as net from 'net'
import { CoraHidOp, CoraMessageFlags, SocketWrapper, type SocketCoraMessage } from '../socketWrapper.js'
import { CORA_MAGIC } from '../constants.js'

jest.mock('../constants.js', () => ({
	...jest.requireActual('../constants.js'),
	TIMEOUT_DURATION: 200,
	RECONNECT_INTERVAL: 500,
}))

const TIMEOUT_DURATION = 200
const RECONNECT_INTERVAL = 500

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitFor(check: () => boolean, timeout = 2000): Promise<void> {
	const end = Date.now() + timeout
	while (!check()) {
		if (Date.now() > end) throw new Error('Timed out waiting for condition')
		await sleep(5)
	}
}

function busyWait(ms: number): void {
	const end = Date.now() + ms
	while (Date.now() < end) {
		// Block the event loop, as if the process were suspended
	}
}

function createLegacyKeepAlive(connectionNo = 0): Buffer {
	const packet = Buffer.alloc(512)
	packet.writeUInt8(1, 0)
	packet.writeUInt8(10, 1)
	packet.writeUInt8(connectionNo, 5)
	return packet
}

function createLegacyData(fill: number): Buffer {
	const packet = Buffer.alloc(512, fill)
	packet.writeUInt8(1, 0)
	packet.writeUInt8(0, 1)
	return packet
}

function encodeCoraMessage(message: SocketCoraMessage): Buffer {
	const buffer = Buffer.alloc(16 + message.payload.length)
	CORA_MAGIC.copy(buffer, 0)
	buffer.writeUint16LE(message.flags, 4)
	buffer.writeUint8(message.hidOp, 6)
	buffer.writeUint32LE(message.messageId, 8)
	buffer.writeUint32LE(message.payload.length, 12)
	buffer.set(message.payload, 16)
	return buffer
}

function createCoraKeepAlive(messageId = 0, connectionNo = 0): Buffer {
	const payload = Buffer.alloc(32)
	payload.writeUInt8(1, 0)
	payload.writeUInt8(10, 1)
	payload.writeUInt8(connectionNo, 5)
	return encodeCoraMessage({ flags: CoraMessageFlags.VERBATIM, hidOp: CoraHidOp.WRITE, messageId, payload })
}

function createCoraData(messageId: number, payload: Buffer): Buffer {
	return encodeCoraMessage({ flags: CoraMessageFlags.RESULT, hidOp: CoraHidOp.GET_REPORT, messageId, payload })
}

/** Decode the cora messages the wrapper has sent to the server */
function decodeCoraMessages(data: Buffer): SocketCoraMessage[] {
	const messages: SocketCoraMessage[] = []
	let offset = 0
	while (offset + 16 <= data.length) {
		expect(data.subarray(offset, offset + 4)).toEqual(CORA_MAGIC)
		const payloadLength = data.readUint32LE(offset + 12)
		messages.push({
			flags: data.readUint16LE(offset + 4),
			hidOp: data.readUint8(offset + 6),
			messageId: data.readUint32LE(offset + 8),
			payload: data.subarray(offset + 16, offset + 16 + payloadLength),
		})
		offset += 16 + payloadLength
	}
	expect(offset).toBe(data.length)
	return messages
}

class ServerConnection {
	readonly socket: net.Socket
	received = Buffer.alloc(0)
	closed = false

	constructor(socket: net.Socket) {
		this.socket = socket
		socket.on('data', (data) => {
			this.received = Buffer.concat([this.received, data])
		})
		socket.on('close', () => {
			this.closed = true
		})
		socket.on('error', () => null)
	}

	async write(data: Buffer): Promise<void> {
		return new Promise((resolve, reject) => this.socket.write(data, (err) => (err ? reject(err) : resolve())))
	}

	/** Write each chunk separately, giving the client a chance to read each one before the next is sent */
	async writeChunks(chunks: Buffer[]): Promise<void> {
		for (const chunk of chunks) {
			await this.write(chunk)
			await sleep(20)
		}
	}
}

class TestServer {
	readonly #server: net.Server
	readonly connections: ServerConnection[] = []
	#keepAliveInterval: NodeJS.Timeout | null = null

	constructor() {
		this.#server = net.createServer((socket) => {
			this.connections.push(new ServerConnection(socket))
		})
	}

	get port(): number {
		return (this.#server.address() as net.AddressInfo).port
	}

	get latest(): ServerConnection {
		const connection = this.connections[this.connections.length - 1]
		if (!connection) throw new Error('No connection')
		return connection
	}

	async listen(port = 0): Promise<void> {
		return new Promise((resolve) => this.#server.listen(port, '127.0.0.1', resolve))
	}

	async waitForConnection(count = this.connections.length + 1): Promise<ServerConnection> {
		await waitFor(() => this.connections.length >= count)
		return this.connections[count - 1]
	}

	startKeepAlives(createPacket: () => Buffer): void {
		this.stopKeepAlives()
		this.#keepAliveInterval = setInterval(() => {
			for (const connection of this.connections) {
				if (!connection.closed) connection.socket.write(createPacket())
			}
		}, 20)
	}

	stopKeepAlives(): void {
		if (this.#keepAliveInterval) clearInterval(this.#keepAliveInterval)
		this.#keepAliveInterval = null
	}

	async close(): Promise<void> {
		this.stopKeepAlives()
		for (const connection of this.connections) connection.socket.destroy()
		if (!this.#server.listening) return
		await new Promise<void>((resolve) => this.#server.close(() => resolve()))
	}
}

describe('SocketWrapper', () => {
	let server: TestServer
	let wrapper: SocketWrapper | null
	let checkInterval: NodeJS.Timeout | null
	let errors: Array<[string, any]>

	beforeEach(async () => {
		server = new TestServer()
		await server.listen()
		wrapper = null
		checkInterval = null
		errors = []
	})

	afterEach(async () => {
		if (checkInterval) clearInterval(checkInterval)
		await wrapper?.close()
		await server.close()
	})

	function createWrapper(port = server.port): SocketWrapper {
		const newWrapper = new SocketWrapper('127.0.0.1', port)
		newWrapper.on('error', (str, e) => errors.push([str, e]))
		wrapper = newWrapper
		return newWrapper
	}

	/** Mimic the polling done by the ConnectionManager */
	function startTimeoutChecks(target: SocketWrapper): void {
		checkInterval = setInterval(() => target.checkForTimeout(), 10)
	}

	async function waitForEvent(target: SocketWrapper, event: 'connected' | 'disconnected'): Promise<void> {
		return new Promise((resolve) => target.once(event, () => resolve()))
	}

	async function connectLegacy(): Promise<{ wrapper: SocketWrapper; connection: ServerConnection }> {
		const wrapper = createWrapper()
		const connection = await server.waitForConnection()
		const connected = waitForEvent(wrapper, 'connected')
		await connection.write(createLegacyKeepAlive())
		await connected
		// Wait for the ack, so that it doesn't get mixed up with anything the test sends
		await waitFor(() => connection.received.length >= 1024)
		return { wrapper, connection }
	}

	async function connectCora(): Promise<{ wrapper: SocketWrapper; connection: ServerConnection }> {
		const wrapper = createWrapper()
		const connection = await server.waitForConnection()
		const connected = waitForEvent(wrapper, 'connected')
		await connection.write(createCoraKeepAlive())
		await connected
		// Wait for the ack, so that it doesn't get mixed up with anything the test sends
		await waitFor(() => connection.received.length >= 16 + 32)
		return { wrapper, connection }
	}

	describe('construction', () => {
		test('exposes the address and port', () => {
			const wrapper = createWrapper()
			expect(wrapper.address).toBe('127.0.0.1')
			expect(wrapper.port).toBe(server.port)
			expect(wrapper.connected).toBe(false)
			expect(wrapper.isCora).toBe(false)
			expect(wrapper.isLegacy).toBe(false)
		})

		test('uses the default port when none is given', async () => {
			const wrapper = new SocketWrapper('127.0.0.1', 0)
			wrapper.on('error', () => null)
			expect(wrapper.port).toBe(5343)
			await wrapper.close()
		})

		test('is not connected until a keepalive is received', async () => {
			const wrapper = createWrapper()
			await server.waitForConnection()
			await sleep(50)
			expect(wrapper.connected).toBe(false)
		})
	})

	describe('legacy protocol', () => {
		test('connects on keepalive and acks it', async () => {
			const wrapper = createWrapper()
			const connection = await server.waitForConnection()

			const onConnected = jest.fn()
			wrapper.on('connected', onConnected)

			await connection.write(createLegacyKeepAlive(7))
			await waitFor(() => connection.received.length >= 1024)

			expect(wrapper.connected).toBe(true)
			expect(wrapper.isLegacy).toBe(true)
			expect(wrapper.isCora).toBe(false)

			await sleep(10)
			expect(onConnected).toHaveBeenCalledTimes(1)
			expect(onConnected).toHaveBeenCalledWith(wrapper)

			const expectedAck = Buffer.alloc(1024)
			expectedAck.writeUInt8(3, 0)
			expectedAck.writeUInt8(26, 1)
			expectedAck.writeUInt8(7, 2)
			expect(connection.received).toEqual(expectedAck)
		})

		test('only emits connected once for repeated keepalives', async () => {
			const { wrapper, connection } = await connectLegacy()

			const onConnected = jest.fn()
			wrapper.on('connected', onConnected)

			await connection.write(Buffer.concat([createLegacyKeepAlive(), createLegacyKeepAlive()]))
			await waitFor(() => connection.received.length >= 1024 * 3)
			await sleep(10)

			expect(onConnected).not.toHaveBeenCalled()
		})

		test('emits data packets', async () => {
			const { wrapper, connection } = await connectLegacy()

			const received: Buffer[] = []
			wrapper.on('dataLegacy', (data) => received.push(Buffer.from(data)))

			await connection.write(createLegacyData(0x11))
			await waitFor(() => received.length >= 1)

			expect(received).toEqual([createLegacyData(0x11)])
		})

		test('reassembles packets split across chunks', async () => {
			const { wrapper, connection } = await connectLegacy()

			const received: Buffer[] = []
			wrapper.on('dataLegacy', (data) => received.push(Buffer.from(data)))

			const packet = createLegacyData(0x22)
			await connection.writeChunks([packet.subarray(0, 100), packet.subarray(100, 300), packet.subarray(300)])
			await waitFor(() => received.length >= 1)

			expect(received).toEqual([packet])
		})

		test('splits multiple packets in one chunk', async () => {
			const { wrapper, connection } = await connectLegacy()

			const received: Buffer[] = []
			wrapper.on('dataLegacy', (data) => received.push(Buffer.from(data)))

			const packets = [createLegacyData(0x01), createLegacyData(0x02), createLegacyData(0x03)]
			const combined = Buffer.concat(packets)
			// Split mid-packet, to check the remainder is kept
			await connection.writeChunks([combined.subarray(0, 700), combined.subarray(700)])
			await waitFor(() => received.length >= 3)

			expect(received).toEqual(packets)
		})

		test('detects the protocol when the first chunk is tiny', async () => {
			const wrapper = createWrapper()
			const connection = await server.waitForConnection()

			const connected = waitForEvent(wrapper, 'connected')
			const keepAlive = createLegacyKeepAlive()
			await connection.writeChunks([keepAlive.subarray(0, 1), keepAlive.subarray(1)])
			await connected

			expect(wrapper.isLegacy).toBe(true)
			expect(errors).toEqual([])
		})

		test('reports errors thrown by data listeners', async () => {
			const { wrapper, connection } = await connectLegacy()

			const failure = new Error('listener failed')
			wrapper.on('dataLegacy', () => {
				throw failure
			})

			await connection.write(createLegacyData(0x33))
			await waitFor(() => errors.length >= 1)

			expect(errors).toEqual([['Handle data error', failure]])
		})

		test('sendLegacyWrites writes the buffers verbatim', async () => {
			const { wrapper, connection } = await connectLegacy()
			const ackLength = connection.received.length

			wrapper.sendLegacyWrites([Buffer.from([1, 2, 3]), Buffer.from([4, 5])])
			await waitFor(() => connection.received.length >= ackLength + 5)

			expect(connection.received.subarray(ackLength)).toEqual(Buffer.from([1, 2, 3, 4, 5]))
		})

		test('sendCoraWrites throws', async () => {
			const { wrapper } = await connectLegacy()

			expect(() => wrapper.sendCoraWrites([])).toThrow('sendCoraWrites can only be used in cora mode')
		})
	})

	describe('cora protocol', () => {
		test('connects on keepalive and acks it', async () => {
			const wrapper = createWrapper()
			const connection = await server.waitForConnection()

			const onConnected = jest.fn()
			wrapper.on('connected', onConnected)

			await connection.write(createCoraKeepAlive(1234, 9))
			await waitFor(() => connection.received.length >= 16 + 32)

			expect(wrapper.connected).toBe(true)
			expect(wrapper.isCora).toBe(true)
			expect(wrapper.isLegacy).toBe(false)

			await sleep(10)
			expect(onConnected).toHaveBeenCalledTimes(1)

			const expectedPayload = Buffer.alloc(32)
			expectedPayload.writeUInt8(3, 0)
			expectedPayload.writeUInt8(26, 1)
			expectedPayload.writeUInt8(9, 2)
			expect(decodeCoraMessages(connection.received)).toEqual([
				{
					flags: CoraMessageFlags.ACK_NAK,
					hidOp: CoraHidOp.WRITE,
					messageId: 1234,
					payload: expectedPayload,
				},
			])
		})

		test('emits data messages', async () => {
			const { wrapper, connection } = await connectCora()

			const received: SocketCoraMessage[] = []
			wrapper.on('dataCora', (message) => received.push({ ...message, payload: Buffer.from(message.payload) }))

			await connection.write(createCoraData(42, Buffer.from([0x83, 1, 2, 3])))
			await waitFor(() => received.length >= 1)

			expect(received).toEqual([
				{
					flags: CoraMessageFlags.RESULT,
					hidOp: CoraHidOp.GET_REPORT,
					messageId: 42,
					payload: Buffer.from([0x83, 1, 2, 3]),
				},
			])
		})

		test('emits messages with an empty payload', async () => {
			const { wrapper, connection } = await connectCora()

			const received: SocketCoraMessage[] = []
			wrapper.on('dataCora', (message) => received.push(message))

			await connection.write(createCoraData(5, Buffer.alloc(0)))
			await waitFor(() => received.length >= 1)

			expect(received[0].messageId).toBe(5)
			expect(received[0].payload.length).toBe(0)
		})

		test('reassembles messages split across chunks', async () => {
			const { wrapper, connection } = await connectCora()

			const received: SocketCoraMessage[] = []
			wrapper.on('dataCora', (message) => received.push({ ...message, payload: Buffer.from(message.payload) }))

			const payload = Buffer.alloc(300, 0x44)
			const message = createCoraData(7, payload)
			// Split inside the magic, inside the header, and inside the payload
			await connection.writeChunks([
				message.subarray(0, 2),
				message.subarray(2, 10),
				message.subarray(10, 100),
				message.subarray(100),
			])
			await waitFor(() => received.length >= 1)

			expect(received).toHaveLength(1)
			expect(received[0].messageId).toBe(7)
			expect(received[0].payload).toEqual(payload)
		})

		test('splits multiple messages in one chunk', async () => {
			const { wrapper, connection } = await connectCora()

			const received: number[] = []
			wrapper.on('dataCora', (message) => received.push(message.messageId))

			await connection.write(
				Buffer.concat([
					createCoraData(1, Buffer.from([1])),
					createCoraData(2, Buffer.alloc(0)),
					createCoraData(3, Buffer.from([3, 3, 3])),
				]),
			)
			await waitFor(() => received.length >= 3)

			expect(received).toEqual([1, 2, 3])
		})

		test('skips garbage before the magic bytes', async () => {
			const { wrapper, connection } = await connectCora()

			const received: number[] = []
			wrapper.on('dataCora', (message) => received.push(message.messageId))

			await connection.write(Buffer.concat([Buffer.alloc(20, 0xff), createCoraData(11, Buffer.from([1]))]))
			await waitFor(() => received.length >= 1)

			expect(received).toEqual([11])
		})

		test('recovers when the magic bytes are split across garbage chunks', async () => {
			const { wrapper, connection } = await connectCora()

			const received: number[] = []
			wrapper.on('dataCora', (message) => received.push(message.messageId))

			const message = createCoraData(12, Buffer.from([1]))
			await connection.writeChunks([
				Buffer.concat([Buffer.alloc(20, 0xff), message.subarray(0, 2)]),
				message.subarray(2),
			])
			await waitFor(() => received.length >= 1)

			expect(received).toEqual([12])
		})

		test('detects the protocol when the first chunk is smaller than the magic', async () => {
			const wrapper = createWrapper()
			const connection = await server.waitForConnection()

			const connected = waitForEvent(wrapper, 'connected')
			const keepAlive = createCoraKeepAlive()
			await connection.writeChunks([keepAlive.subarray(0, 2), keepAlive.subarray(2)])
			await connected

			expect(wrapper.isCora).toBe(true)
			expect(errors).toEqual([])
		})

		test('sendCoraWrites encodes the messages', async () => {
			const { wrapper, connection } = await connectCora()
			const ackLength = connection.received.length

			wrapper.sendCoraWrites([
				{
					flags: CoraMessageFlags.VERBATIM | CoraMessageFlags.REQ_ACK,
					hidOp: CoraHidOp.SEND_REPORT,
					messageId: 0x12345678,
					payload: Buffer.from([9, 8, 7]),
				},
				{
					flags: CoraMessageFlags.VERBATIM,
					hidOp: CoraHidOp.WRITE,
					messageId: 1,
					payload: Buffer.alloc(0),
				},
			])
			await waitFor(() => connection.received.length >= ackLength + 16 + 3 + 16)

			expect(decodeCoraMessages(connection.received.subarray(ackLength))).toEqual([
				{
					flags: CoraMessageFlags.VERBATIM | CoraMessageFlags.REQ_ACK,
					hidOp: CoraHidOp.SEND_REPORT,
					messageId: 0x12345678,
					payload: Buffer.from([9, 8, 7]),
				},
				{
					flags: CoraMessageFlags.VERBATIM,
					hidOp: CoraHidOp.WRITE,
					messageId: 1,
					payload: Buffer.alloc(0),
				},
			])
		})

		test('sendLegacyWrites throws', async () => {
			const { wrapper } = await connectCora()

			expect(() => wrapper.sendLegacyWrites([])).toThrow('sendLegacyWrites can only be used in legacy mode')
		})
	})

	describe('protocol detection', () => {
		test('reports an unknown protocol', async () => {
			const wrapper = createWrapper()
			const connection = await server.waitForConnection()

			await connection.write(Buffer.alloc(64, 0x55))
			await waitFor(() => errors.length >= 1)

			expect(errors[0][0]).toBe('Unknown packet type')
			expect(wrapper.connected).toBe(false)
			expect(wrapper.isCora).toBe(false)
			expect(wrapper.isLegacy).toBe(false)
		})

		test('sending throws before the protocol is known', () => {
			const wrapper = createWrapper()

			expect(() => wrapper.sendLegacyWrites([])).toThrow()
			expect(() => wrapper.sendCoraWrites([])).toThrow()
		})
	})

	describe('disconnect and reconnect', () => {
		test('emits disconnected once when the remote closes', async () => {
			const { wrapper, connection } = await connectLegacy()

			const onDisconnected = jest.fn()
			wrapper.on('disconnected', onDisconnected)

			connection.socket.destroy()
			await waitFor(() => onDisconnected.mock.calls.length >= 1)
			await sleep(50)

			expect(onDisconnected).toHaveBeenCalledTimes(1)
			expect(onDisconnected).toHaveBeenCalledWith(wrapper)
			expect(wrapper.connected).toBe(false)
		})

		test('reconnects after the reconnect interval when the remote closes', async () => {
			const { wrapper, connection } = await connectLegacy()

			const closedAt = Date.now()
			connection.socket.destroy()

			await server.waitForConnection(2)
			expect(Date.now() - closedAt).toBeGreaterThanOrEqual(RECONNECT_INTERVAL - 20)

			const connected = waitForEvent(wrapper, 'connected')
			await server.latest.write(createLegacyKeepAlive())
			await connected
			expect(wrapper.connected).toBe(true)
		})

		test('retries when the connection is refused', async () => {
			const port = server.port
			await server.close()

			const wrapper = createWrapper(port)
			await waitFor(() => errors.length >= 1)
			expect(errors[0][0]).toBe('socket error')

			server = new TestServer()
			await server.listen(port)

			const connection = await server.waitForConnection()
			const connected = waitForEvent(wrapper, 'connected')
			await connection.write(createLegacyKeepAlive())
			await connected
		})

		test('does not emit disconnected when the connection is refused', async () => {
			const port = server.port
			await server.close()

			const wrapper = createWrapper(port)
			const onDisconnected = jest.fn()
			wrapper.on('disconnected', onDisconnected)

			await waitFor(() => errors.length >= 1)
			await sleep(50)

			expect(onDisconnected).not.toHaveBeenCalled()
		})

		test('resets the protocol on reconnect', async () => {
			const { wrapper, connection } = await connectLegacy()
			expect(wrapper.isLegacy).toBe(true)

			connection.socket.destroy()
			const newConnection = await server.waitForConnection(2)
			expect(wrapper.isLegacy).toBe(false)

			const connected = waitForEvent(wrapper, 'connected')
			await newConnection.write(createCoraKeepAlive())
			await connected

			expect(wrapper.isCora).toBe(true)
		})

		test('discards a partial legacy packet from the previous connection', async () => {
			const { wrapper, connection } = await connectLegacy()

			// Leave half a packet in the receive buffer
			await connection.write(createLegacyData(0x66).subarray(0, 100))
			await sleep(20)
			connection.socket.destroy()

			const newConnection = await server.waitForConnection(2)
			const connected = waitForEvent(wrapper, 'connected')
			await newConnection.write(createLegacyKeepAlive())
			await connected

			expect(wrapper.connected).toBe(true)
		})

		test('discards a partial cora message from the previous connection', async () => {
			const { wrapper, connection } = await connectCora()

			// Leave a header claiming a large payload in the receive buffer
			await connection.write(createCoraData(1, Buffer.alloc(1000)).subarray(0, 50))
			await sleep(20)
			connection.socket.destroy()

			const newConnection = await server.waitForConnection(2)
			const connected = waitForEvent(wrapper, 'connected')
			await newConnection.write(createCoraKeepAlive())
			await connected

			expect(wrapper.connected).toBe(true)
		})
	})

	describe('timeout', () => {
		test('stays connected while keepalives arrive', async () => {
			const { wrapper } = await connectLegacy()
			server.startKeepAlives(() => createLegacyKeepAlive())
			startTimeoutChecks(wrapper)

			const onDisconnected = jest.fn()
			wrapper.on('disconnected', onDisconnected)

			await sleep(TIMEOUT_DURATION * 3)

			expect(onDisconnected).not.toHaveBeenCalled()
			expect(wrapper.connected).toBe(true)
		})

		test('disconnects when keepalives stop', async () => {
			const { wrapper } = await connectLegacy()
			startTimeoutChecks(wrapper)

			const disconnected = waitForEvent(wrapper, 'disconnected')
			const start = Date.now()
			await disconnected

			expect(Date.now() - start).toBeGreaterThanOrEqual(TIMEOUT_DURATION - 20)
			expect(wrapper.connected).toBe(false)
		})

		test('emits disconnected once on timeout', async () => {
			const { wrapper } = await connectLegacy()

			const onDisconnected = jest.fn()
			wrapper.on('disconnected', onDisconnected)

			startTimeoutChecks(wrapper)
			await waitFor(() => onDisconnected.mock.calls.length >= 1)
			// Keep checking while the socket is being torn down and reconnected
			await server.waitForConnection(2)
			await sleep(50)

			expect(onDisconnected).toHaveBeenCalledTimes(1)
		})

		test('reconnects immediately after a timeout', async () => {
			const { wrapper, connection } = await connectLegacy()
			startTimeoutChecks(wrapper)

			await waitForEvent(wrapper, 'disconnected')
			const disconnectedAt = Date.now()

			const newConnection = await server.waitForConnection(2)
			expect(Date.now() - disconnectedAt).toBeLessThan(RECONNECT_INTERVAL / 2)
			await waitFor(() => connection.closed)

			const connected = waitForEvent(wrapper, 'connected')
			await newConnection.write(createLegacyKeepAlive())
			await connected
		})

		test('does not emit disconnected when the timeout fires before ever connecting', async () => {
			const wrapper = createWrapper()
			startTimeoutChecks(wrapper)

			const onDisconnected = jest.fn()
			wrapper.on('disconnected', onDisconnected)

			// The server accepts but never sends a keepalive, so the connection is retried
			await server.waitForConnection(2)
			await sleep(20)

			expect(onDisconnected).not.toHaveBeenCalled()
		})

		test('does not disconnect when keepalives are buffered while the event loop is stalled', async () => {
			const { wrapper } = await connectLegacy()
			server.startKeepAlives(() => createLegacyKeepAlive())
			startTimeoutChecks(wrapper)

			const onDisconnected = jest.fn()
			wrapper.on('disconnected', onDisconnected)

			// Stall inside a timer, so that the next loop iteration runs the timeout check before reading the socket
			await new Promise<void>((resolve) =>
				setTimeout(() => {
					busyWait(TIMEOUT_DURATION * 3)
					resolve()
				}, 0),
			)

			await sleep(100)

			expect(onDisconnected).not.toHaveBeenCalled()
			expect(wrapper.connected).toBe(true)
		})

		test('does not time out while waiting to retry', async () => {
			const port = server.port
			await server.close()

			const wrapper = createWrapper(port)
			startTimeoutChecks(wrapper)
			await waitFor(() => errors.length >= 1)

			// Longer than the timeout, but shorter than the retry interval
			await sleep(TIMEOUT_DURATION + 100)

			// Only the single refused attempt should have been made
			expect(errors).toHaveLength(1)
		})
	})

	describe('close', () => {
		test('emits disconnected when closed while connected', async () => {
			const { wrapper } = await connectLegacy()

			const disconnected = waitForEvent(wrapper, 'disconnected')
			await wrapper.close()
			await disconnected

			expect(wrapper.connected).toBe(false)
		})

		test('does not reconnect after close', async () => {
			const { wrapper, connection } = await connectLegacy()
			startTimeoutChecks(wrapper)

			await wrapper.close()
			await waitFor(() => connection.closed)
			await sleep(RECONNECT_INTERVAL + 100)

			expect(server.connections).toHaveLength(1)
		})

		test('cancels a pending retry', async () => {
			const { wrapper, connection } = await connectLegacy()

			connection.socket.destroy()
			await waitForEvent(wrapper, 'disconnected')

			await wrapper.close()
			await sleep(RECONNECT_INTERVAL + 100)

			expect(server.connections).toHaveLength(1)
		})

		test('does not report errors after close', async () => {
			const port = server.port
			await server.close()

			const wrapper = createWrapper(port)
			await wrapper.close()
			await sleep(50)

			expect(errors).toEqual([])
		})
	})
})
