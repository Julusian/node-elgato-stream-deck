import * as EventEmitter from 'events'
import type { OpenStreamDeckOptionsTcp, StreamDeckTcp } from './types.js'
import { DEFAULT_TCP_PORT } from './constants.js'
import { SocketWrapper } from './socketWrapper.js'
import { type JPEGEncodeOptions, encodeJPEG } from '@elgato-stream-deck/node-lib'
import type { HIDDevice, OpenStreamDeckOptions, ChildHIDDeviceInfo, PropertiesService } from '@elgato-stream-deck/core'
import { DEVICE_MODELS, parseAllFirmwareVersionsHelper } from '@elgato-stream-deck/core'
import { StreamDeckTcpWrapper } from './tcpWrapper.js'
import { TcpLegacyHidDevice } from './hid-device/legacy.js'
import { TcpCoraHidDevice } from './hid-device/cora.js'
import type { TcpHidDevice } from './hid-device/api.js'

export interface StreamDeckTcpConnectionManagerEvents {
	connected: [streamdeck: StreamDeckTcp]
	disconnected: [streamdeck: StreamDeckTcp]
	error: [message: string]
}

/** For future use */
export type StreamDeckTcpConnectionOptions = Record<string, never>

export interface SocketAndInfo {
	readonly socket: SocketWrapper
	childId: string | null
}

export class StreamDeckTcpConnectionManager extends EventEmitter<StreamDeckTcpConnectionManagerEvents> {
	readonly #connections = new Map<string, SocketAndInfo>()
	readonly #streamdecks = new Map<string, StreamDeckTcpWrapper>()

	readonly #openOptions: Required<OpenStreamDeckOptions>
	readonly #autoConnectToSecondaries: boolean

	#timeoutInterval: NodeJS.Timeout | null = null

	constructor(userOptions?: OpenStreamDeckOptionsTcp) {
		super()

		// Clone the options, to ensure they dont get changed
		const jpegOptions: JPEGEncodeOptions | undefined = userOptions?.jpegOptions
			? { ...userOptions.jpegOptions }
			: undefined

		this.#openOptions = {
			encodeJPEG: async (buffer: Uint8Array, width: number, height: number) =>
				encodeJPEG(buffer, width, height, jpegOptions),
			...userOptions,
		}
		this.#autoConnectToSecondaries = userOptions?.autoConnectToSecondaries ?? true
	}

	#getConnectionId(address: string, port: number) {
		return `${address}:${port || DEFAULT_TCP_PORT}`
	}

	#onSocketConnected = (socket: SocketWrapper) => {
		const connectionId = this.#getConnectionId(socket.address, socket.port)

		console.log('opened', connectionId, socket.isCora, socket.isLegacy)
		const fakeHidDevice: TcpHidDevice = socket.isCora
			? new TcpCoraHidDevice(socket)
			: new TcpLegacyHidDevice(socket)

		// Setup a temporary error handler, in case an error gets produced during the setup
		const tmpErrorHandler = () => {
			// No-op?
		}
		fakeHidDevice.on('error', tmpErrorHandler)

		fakeHidDevice
			.getDeviceInfo()
			.then((info) => {
				// if (info.productId === 0xffff) {
				// 	// This is a Cora parent device

				// 	console.log('Found Cora parent device', info)
				// } else {
				const model = DEVICE_MODELS.find((m) => m.productIds.includes(info.productId))
				if (!model) {
					// Note: leave the temporary error handler, to ensure it can't cause a crash
					this.emit('error', `Found StreamDeck with unknown productId: ${info.productId.toString(16)}`)
					return
				}

				const propertiesService = fakeHidDevice.isPrimary ? new TcpPropertiesService(fakeHidDevice) : undefined
				const streamdeckSocket = model.factory(fakeHidDevice, this.#openOptions, propertiesService)
				const streamDeckTcp = new StreamDeckTcpWrapper(socket, fakeHidDevice, streamdeckSocket)

				fakeHidDevice.off('error', tmpErrorHandler)

				this.#streamdecks.set(connectionId, streamDeckTcp)

				setImmediate(() => this.emit('connected', streamDeckTcp))

				if (this.#autoConnectToSecondaries && fakeHidDevice.isPrimary) {
					this.#tryConnectingToSecondary(connectionId, socket, streamDeckTcp)
				}
				// }
			})
			.catch((err) => {
				this.emit('error', `Failed to open device ${connectionId}: ${err}`)
			})
	}

	#tryConnectingToSecondary(parentId: string, _parentSocket: SocketWrapper, parent: StreamDeckTcpWrapper) {
		const connectToUpdatedChildInfo = (info: ChildHIDDeviceInfo | null) => {
			// Check the current parent is still active
			const currentParent = this.#streamdecks.get(parentId)
			if (currentParent !== parent) return

			// Get the parent socket info, this should always exist
			const parentSocketInfo = this.#connections.get(parentId)
			if (!parentSocketInfo) return
			if (!info) {
				// Child disconnected
				if (parentSocketInfo.childId) {
					this.#disconnectFromId(parentSocketInfo.childId)
					parentSocketInfo.childId = null
				}
			} else {
				const childId = this.#getConnectionId(parent.remoteAddress, info.tcpPort)
				if (childId === parentId) return // Shouldn't happen, but could cause an infinite loop

				if (parentSocketInfo.childId !== childId || !this.#connections.has(childId)) {
					// Make sure an existing child is disposed
					if (parentSocketInfo.childId) {
						this.#disconnectFromId(parentSocketInfo.childId)
					}

					// Start connecting to the new child
					parentSocketInfo.childId = childId
					this.#connectToInternal(parent.remoteAddress, info.tcpPort, {})
				}
			}
		}

		// Setup watching hotplug events
		parent.tcpEvents.on('childChange', (info) => connectToUpdatedChildInfo(info))

		// Do a check now, to see what is connected
		parent
			.getChildDeviceInfo()
			.then((childInfo) => connectToUpdatedChildInfo(childInfo))
			.catch(() => {
				// TODO - log
			})
	}

	#onSocketDisconnected = (socket: SocketWrapper) => {
		const id = this.#getConnectionId(socket.address, socket.port)

		// Clear and re-add all listeners, to ensure we don't leak anything
		socket.removeAllListeners()
		this.#setupSocketEventHandlers(socket)

		const streamdeck = this.#streamdecks.get(id)
		if (streamdeck) {
			this.#streamdecks.delete(id)

			setImmediate(() => this.emit('disconnected', streamdeck))
		}
	}

	#startTimeoutInterval() {
		if (this.#timeoutInterval) return

		this.#timeoutInterval = setInterval(() => {
			for (const entry of this.#connections.values()) {
				entry.socket.checkForTimeout()
			}
		}, 1000)
	}

	#stopTimeoutInterval() {
		if (!this.#timeoutInterval) return
		if (this.#connections.size > 0) return

		clearInterval(this.#timeoutInterval)
		this.#timeoutInterval = null
	}

	connectTo(
		address: string,
		port: number = DEFAULT_TCP_PORT,
		options?: Partial<StreamDeckTcpConnectionOptions>,
	): void {
		if (!this.#connectToInternal(address, port, options)) {
			throw new Error('Connection already exists')
		}
	}

	#connectToInternal(
		address: string,
		port: number,
		_options: Partial<StreamDeckTcpConnectionOptions> | undefined,
	): boolean {
		const id = this.#getConnectionId(address, port)

		if (this.#connections.has(id)) return false

		const newSocket = new SocketWrapper(address, port)
		this.#setupSocketEventHandlers(newSocket)
		this.#connections.set(id, { socket: newSocket, childId: null })

		this.#startTimeoutInterval()

		return true
	}

	#setupSocketEventHandlers(socket: SocketWrapper) {
		socket.on('connected', () => this.#onSocketConnected(socket))
		socket.on('disconnected', () => this.#onSocketDisconnected(socket))
		socket.on('error', () => {
			// TODO
		})
	}

	disconnectFrom(address: string, port: number = DEFAULT_TCP_PORT): boolean {
		const id = this.#getConnectionId(address, port)

		return this.#disconnectFromId(id)
	}

	#disconnectFromId(id: string): boolean {
		const entry = this.#connections.get(id)
		if (!entry) return false

		// Disconnect from child if it is known
		if (entry.childId) {
			this.#disconnectFromId(entry.childId)
		}

		this.#connections.delete(id)

		entry.socket.close().catch(() => {
			// TODO - log
		})

		this.#stopTimeoutInterval()

		return true
	}

	disconnectFromAll(): void {
		for (const socket of this.#connections.values()) {
			socket.socket.close().catch(() => {
				// TODO - log
			})
		}

		this.#connections.clear()
	}

	getStreamdeckFor(address: string, port: number = DEFAULT_TCP_PORT): StreamDeckTcp | undefined {
		return this.#streamdecks.get(this.#getConnectionId(address, port))
	}
}

class TcpPropertiesService implements PropertiesService {
	readonly #device: HIDDevice

	constructor(device: HIDDevice) {
		this.#device = device
	}

	public async setBrightness(percentage: number): Promise<void> {
		if (percentage < 0 || percentage > 100) {
			throw new RangeError('Expected brightness percentage to be between 0 and 100')
		}

		const buffer = Buffer.alloc(1024)
		buffer.writeUint8(0x03, 0)
		buffer.writeUint8(0x08, 1)
		buffer.writeUint8(percentage, 2)

		await this.#device.sendFeatureReport(buffer)
	}

	public async resetToLogo(): Promise<void> {
		throw new Error('Not implemented')
		// TODO the soft reset below is too much, needs something lighter

		// const buffer = Buffer.alloc(1024)
		// buffer.writeUint8(0x03, 0)
		// buffer.writeUint8(0x0b, 1)
		// buffer.writeUint8(0, 2) // Soft Reset

		// await this.#sendMessages([buffer])
	}

	public async getFirmwareVersion(): Promise<string> {
		const data = await this.#device.getFeatureReport(0x83, -1)

		return new TextDecoder('ascii').decode(data.subarray(8, 16))
	}

	public async getAllFirmwareVersions(): Promise<Record<string, string>> {
		const [ap2Data, encoderAp2Data, encoderLdData] = await Promise.all([
			this.#device.getFeatureReport(0x83, -1),
			this.#device.getFeatureReport(0x86, -1),
			this.#device.getFeatureReport(0x8a, -1),
		])

		return parseAllFirmwareVersionsHelper({
			ap2: ap2Data.slice(2),
			encoderAp2: encoderAp2Data.slice(2),
			encoderLd: encoderLdData.slice(2),
		})
	}

	public async getSerialNumber(): Promise<string> {
		const data = await this.#device.getFeatureReport(0x84, -1)

		const length = data[3]
		return new TextDecoder('ascii').decode(data.subarray(4, 4 + length))
	}
}
