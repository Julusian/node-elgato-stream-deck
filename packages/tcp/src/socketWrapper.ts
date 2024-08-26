import { Socket } from 'net'
import * as EventEmitter from 'events'
import { DEFAULT_TCP_PORT, RECONNECT_INTERVAL, TIMEOUT_DURATION } from './constants.js'

export interface SocketWrapperEvents {
	error: [str: string, e: any]
	connected: [self: SocketWrapper]
	disconnected: [self: SocketWrapper]
	data: [data: Buffer]
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

		// Append data to buffer
		if (!this.#receiveBuffer || this.#receiveBuffer.length === 0) {
			this.#receiveBuffer = data
		} else {
			this.#receiveBuffer = Buffer.concat([this.#receiveBuffer, data])
		}

		// Pop and handle packets
		const PACKET_SIZE = 512
		while (this.#receiveBuffer.length >= PACKET_SIZE) {
			const packet = this.#receiveBuffer.subarray(0, PACKET_SIZE)
			this.#receiveBuffer = this.#receiveBuffer.subarray(PACKET_SIZE)

			this.#handleDataPacket(packet)
		}

		// If buffer is empty, remove the reference
		if (this.#receiveBuffer.length === 0) {
			this.#receiveBuffer = null
		}
	}

	#handleDataPacket(packet: Buffer) {
		if (packet[0] === 1 && packet[1] === 10) {
			// Report as connected
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

	sendMessages(buffers: Buffer[]): void {
		// TODO - await write?
		for (const buffer of buffers) {
			this.#socket.write(buffer)
		}
	}
}
