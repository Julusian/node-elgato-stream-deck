import { EventEmitter } from 'eventemitter3'
import type { StreamDeck } from '@elgato-stream-deck/core'
import { StreamDeckProxy } from '@elgato-stream-deck/core'
import type { SocketWrapper } from './socketWrapper.js'
import type { StreamDeckTcp, StreamDeckTcpEvents } from './types.js'
import type { TcpHidDevice } from './hid-device.js'

export class StreamDeckTcpWrapper extends StreamDeckProxy implements StreamDeckTcp {
	readonly #socket: SocketWrapper
	readonly #device: TcpHidDevice
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

	constructor(socket: SocketWrapper, device: TcpHidDevice, streamdeck: StreamDeck) {
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

		return new TextDecoder('hex').decode(data.subarray(4, 10)) // TODO - add colons
	}
}
