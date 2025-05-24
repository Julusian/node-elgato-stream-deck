import { EventEmitter } from 'eventemitter3'
import type { StreamDeck } from '@elgato-stream-deck/core'
import { StreamDeckProxy } from '@elgato-stream-deck/core'
import type { SocketWrapper } from './socketWrapper.js'
import type { StreamDeckTcp, StreamDeckTcpEvents } from './types.js'
import type { TcpCoraHidDevice, TcpHidDevice } from './hid-device.js'

export class StreamDeckTcpWrapper extends StreamDeckProxy implements StreamDeckTcp {
	readonly #socket: SocketWrapper
	readonly #device: TcpHidDevice | TcpCoraHidDevice
	readonly #tcpEvents = new EventEmitter<StreamDeckTcpEvents>()

	get remoteAddress(): string {
		return this.#socket.address
	}
	get remotePort(): number {
		return this.#socket.port
	}

	get tcpEvents(): EventEmitter<StreamDeckTcpEvents> {
		return this.#tcpEvents
	}

	constructor(socket: SocketWrapper, device: TcpHidDevice | TcpCoraHidDevice, streamdeck: StreamDeck) {
		super(streamdeck)

		this.#socket = socket
		this.#device = device

		this.#socket.on('disconnected', () => {
			setImmediate(() => this.#tcpEvents.emit('disconnected'))
		})

		// Forward child info changes
		if (this.#device.isPrimary) {
			this.#device.onChildInfoChange = (info) => {
				this.#tcpEvents.emit('childChange', info)
			}
		}
	}

	async getMacAddress(): Promise<string> {
		if (!this.#device.isPrimary) throw new Error('Not supported on secondary devices')

		const data = await this.#device.getFeatureReport(0x85, -1)

		// This would be nice to do with a TextDecoder, but that doesn't support hex and we are in nodejs so don't need to
		return Array.from(data.subarray(4, 10))
			.map((v) => v.toString(16).padStart(2, '0'))
			.join(':')
	}
}
