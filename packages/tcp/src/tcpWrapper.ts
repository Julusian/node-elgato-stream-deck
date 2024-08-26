import * as EventEmitter from 'events'
import { StreamDeckProxy, StreamDeck } from '@elgato-stream-deck/core'
import { SocketWrapper } from './socketWrapper'
import { StreamDeckTcp, StreamDeckTcpEvents } from './types'
import { TcpHidDevice } from './hid-device'

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
		super(streamdeck, () => null)

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

		return data.toString('hex', 4, 10) // TODO - add colons
	}
}
