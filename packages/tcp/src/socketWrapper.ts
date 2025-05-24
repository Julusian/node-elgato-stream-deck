import { Socket } from 'net'
import * as EventEmitter from 'events'
import { CORA_MAGIC, DEFAULT_TCP_PORT, RECONNECT_INTERVAL, TIMEOUT_DURATION } from './constants.js'

export interface SocketWrapperEvents {
	error: [str: string, e: any]
	connected: [self: SocketWrapper]
	disconnected: [self: SocketWrapper]
	data: [data: Buffer] // TODO - remove?
	dataCora: [message: SocketCoraMessage]
}

export interface SocketCoraMessage {
	flags: CoraMessageFlags
	hidOp: CoraHidOp
	messageId: number // aka STAN
	payload: Buffer
}

export enum CoraHidOp {
	WRITE = 0x00, // hid_write
	SEND_REPORT = 0x01, // hid_send_feature_report
	GET_REPORT = 0x02, // hid_get_feature_report
}

export enum CoraMessageFlags {
	VERBATIM = 0x8000, // In/Out - Payload for child HID device
	REQ_ACK = 0x4000, // Out - Host requests an ACK
	ACK_NAK = 0x0200, // In - Unit response to REQ_ACK
	RESULT = 0x0100, // In - Unit response to GET_REPORT op
	NONE = 0x0000, // No flags set
}

export class SocketWrapper extends EventEmitter<SocketWrapperEvents> {
	readonly #socket: Socket

	readonly #address: string
	readonly #port: number

	#connected = false
	#retryConnectTimeout: NodeJS.Timeout | null = null
	#connectionActive = false // True when connected/connecting/reconnecting
	#lastReceived = Date.now()
	#receiveBuffer: Buffer | null = null

	#packetMode: 'cora' | 'legacy' | 'unknown' = 'unknown'

	get isCora(): boolean {
		return this.#packetMode === 'cora'
	}
	get isLegacy(): boolean {
		return this.#packetMode === 'legacy'
	}

	constructor(host: string, port: number) {
		super()

		this.#socket = new Socket()
		this.#socket.on('error', (e) => {
			if (this.#connectionActive) {
				this.emit('error', 'socket error', e)
			}
		})
		this.#socket.on('close', () => {
			if (this.#connected) this.emit('disconnected', this)
			this.#connected = false

			// if (this._pingInterval) {
			// 	clearInterval(this._pingInterval)
			// 	this._pingInterval = null
			// }
			this._triggerRetryConnection()
		})
		this.#socket.on('data', (d) => this.#handleData(d))

		this.#connectionActive = true

		this.#address = host
		this.#port = port || DEFAULT_TCP_PORT

		this.#socket.connect(this.#port, this.#address)
	}

	get connected(): boolean {
		return this.#connected
	}

	get address(): string {
		return this.#address
	}
	get port(): number {
		return this.#port
	}

	public checkForTimeout(): void {
		if (!this.#connectionActive) return

		if (this.#retryConnectTimeout) return

		if (this.#lastReceived + TIMEOUT_DURATION < Date.now()) {
			this.#connected = false
			setImmediate(() => this.emit('disconnected', this))

			this._retryConnection()
		}
	}

	private _triggerRetryConnection() {
		if (!this.#retryConnectTimeout) {
			this.#retryConnectTimeout = setTimeout(() => {
				this._retryConnection()
			}, RECONNECT_INTERVAL)
		}
	}
	private _retryConnection() {
		if (this.#retryConnectTimeout) {
			clearTimeout(this.#retryConnectTimeout)
			this.#retryConnectTimeout = null
		}

		if (!this.connected && this.#connectionActive) {
			// Avoid timeouts while reconnecting
			this.#lastReceived = Date.now()

			// Reset the packet mode, just in case
			this.#packetMode = 'unknown'

			try {
				this.#socket.connect(this.#port, this.#address)
			} catch (e) {
				this._triggerRetryConnection()
				this.emit('error', 'connection failed', e)
				// this._log('connection failed', e)
				console.log('connection failed', e)
			}
		}
	}

	#handleData(data: Buffer) {
		this.#lastReceived = Date.now()

		// If this is the first packet, check for the packet type
		if (this.#packetMode === 'unknown') {
			if (data.indexOf(CORA_MAGIC) === 0) {
				this.#packetMode = 'cora'
			} else if (data[0] === 1 && data[1] === 10) {
				// Check for SDS packet
				this.#packetMode = 'legacy'
			} else {
				this.emit('error', 'Unknown packet type', new Error())
				return
			}
		}

		// Append data to buffer
		if (!this.#receiveBuffer || this.#receiveBuffer.length === 0) {
			this.#receiveBuffer = data
		} else {
			this.#receiveBuffer = Buffer.concat([this.#receiveBuffer, data])
		}

		switch (this.#packetMode) {
			case 'cora':
				this.#handleCoraDataPackets()
				break
			case 'legacy':
				this.#handleLegacyDataPackets()
				break
			default:
				this.emit('error', 'Unknown packet type', new Error())
				break
		}
	}

	#handleLegacyDataPackets() {
		if (!this.#receiveBuffer) return

		// Pop and handle packets
		const PACKET_SIZE = 512
		while (this.#receiveBuffer.length >= PACKET_SIZE) {
			const packet = this.#receiveBuffer.subarray(0, PACKET_SIZE)
			this.#receiveBuffer = this.#receiveBuffer.subarray(PACKET_SIZE)

			this.#handleLegacyDataPacket(packet)
		}

		// If buffer is empty, remove the reference
		if (this.#receiveBuffer.length === 0) {
			this.#receiveBuffer = null
		}
	}

	#handleLegacyDataPacket(packet: Buffer) {
		if (packet[0] === 1 && packet[1] === 10) {
			// Handle keepalive packet

			// Report as connected, if not already
			if (!this.#connected) {
				this.#connected = true

				setImmediate(() => this.emit('connected', this))
			}

			const ackBuffer = Buffer.alloc(1024)
			ackBuffer.writeUInt8(3, 0)
			ackBuffer.writeUInt8(26, 1)
			ackBuffer.writeUInt8(packet[5], 2) // connection no

			this.#socket.write(ackBuffer)
		} else {
			try {
				this.emit('data', packet)
			} catch (e) {
				this.emit('error', 'Handle data error', e)
			}
		}
	}

	#handleCoraDataPackets() {
		if (!this.#receiveBuffer || this.#receiveBuffer.length < 16) return

		// If the buffer doesn't start with the Cora magic bytes, search for the actual start of the packet
		const coraMagicIndex = this.#receiveBuffer.indexOf(CORA_MAGIC)
		if (coraMagicIndex === -1) {
			// No Cora magic found, discard the buffer and wait for more data
			this.#receiveBuffer = this.#receiveBuffer.subarray(-4) // Keep the last 4 bytes, in case they are part of the next packet magic bytes
			return
		} else if (coraMagicIndex > 0) {
			// If the magic is not at the start, slice the buffer to start from the magic
			this.#receiveBuffer = this.#receiveBuffer.subarray(coraMagicIndex)
		}

		// While there is a full header
		while (this.#receiveBuffer.length >= 16) {
			// Make sure we have the full payload
			const payloadLength = this.#receiveBuffer.readUint32LE(12)
			if (this.#receiveBuffer.length < 16 + payloadLength) return

			const message: SocketCoraMessage = {
				flags: this.#receiveBuffer.readUint16LE(4),
				hidOp: this.#receiveBuffer.readUint8(6),
				messageId: this.#receiveBuffer.readUint32LE(8),
				payload: this.#receiveBuffer.subarray(16, 16 + payloadLength),
			}

			// Pop the remaining content
			this.#receiveBuffer = this.#receiveBuffer.subarray(16 + payloadLength)

			// Handle the message
			this.#handleCoraDataPacket(message)
		}
	}

	#handleCoraDataPacket(packet: SocketCoraMessage) {
		if (packet.payload.length > 4 && packet.payload[0] === 1 && packet.payload[1] === 10) {
			// Handle keepalive packet

			// Report as connected, if not already
			if (!this.#connected) {
				this.#connected = true

				setImmediate(() => this.emit('connected', this))
			}

			const ackBuffer = Buffer.alloc(32)
			ackBuffer.writeUInt8(3, 0)
			ackBuffer.writeUInt8(26, 1)
			ackBuffer.writeUInt8(packet.payload[5], 2) // connection no

			// Send an ACK
			this.#sendCoraMessage({
				flags: CoraMessageFlags.ACK_NAK,
				hidOp: packet.hidOp,
				messageId: packet.messageId,
				payload: ackBuffer,
			})
		} else {
			try {
				this.emit('dataCora', packet)
			} catch (e) {
				this.emit('error', 'Handle data error', e)
			}
		}
	}

	async close(): Promise<void> {
		try {
			this.#connectionActive = false
			if (this.#retryConnectTimeout) {
				clearTimeout(this.#retryConnectTimeout)
				this.#retryConnectTimeout = null
			}
		} finally {
			this.#socket.destroy()
		}
	}

	#sendCoraMessage(message: SocketCoraMessage): void {
		const buffer = Buffer.alloc(16) //+ message.payload.length)
		CORA_MAGIC.copy(buffer, 0, 0, CORA_MAGIC.length)
		buffer.writeUint16LE(message.flags, 4)
		buffer.writeUint8(message.hidOp, 6)
		buffer.writeUint32LE(message.messageId, 8)
		buffer.writeUint32LE(message.payload.length, 12)
		// buffer.set(message.payload, 16)

		// Avoid a copy by writing the payload directly to the socket
		this.#socket.write(buffer)
		this.#socket.write(message.payload)
	}

	sendLegacyWrites(buffers: Uint8Array[]): void {
		if (this.#packetMode !== 'legacy') throw new Error('sendLegacyWrites can only be used in legacy mode')

		for (const buffer of buffers) {
			this.#socket.write(buffer)
		}
	}

	sendCoraWrites(messages: SocketCoraMessage[]): void {
		if (this.#packetMode !== 'cora') throw new Error('sendCoraWrites can only be used in cora mode')

		for (const message of messages) {
			this.#sendCoraMessage(message)
		}
	}
}
