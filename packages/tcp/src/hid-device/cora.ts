import { EventEmitter } from 'events'
import {
	type HIDDeviceInfo,
	type HIDDeviceEvents,
	type ChildHIDDeviceInfo,
	type StreamDeckTcpChildDeviceInfo,
	uint8ArrayToDataView,
	VENDOR_ID,
} from '@elgato-stream-deck/core'
import { CoraHidOp, CoraMessageFlags, type SocketCoraMessage, type SocketWrapper } from '../socketWrapper.js'
import { parseDevice2Info } from '../device2Info.js'
import { QueuedCommand } from './util.js'
import type { TcpHidDevice } from './api.js'

const FIRST_STAN = 0x07b3 // This is what the elgato software uses, no idea why

/**
 * A HIDDevice implementation for cora based TCP connections
 * This isn't really HID, but it fits the existing structure well enough
 * Note: this gets destroyed when the socket is closed, so we can rely on this for resetting the state
 */
export class TcpCoraHidDevice extends EventEmitter<HIDDeviceEvents> implements TcpHidDevice {
	readonly #socket: SocketWrapper
	#isPrimary = true
	#onChildInfoChange: ((info: Omit<StreamDeckTcpChildDeviceInfo, 'model'> | null) => void) | null = null

	get isPrimary(): boolean {
		return this.#isPrimary
	}

	set onChildInfoChange(cb: ((info: Omit<StreamDeckTcpChildDeviceInfo, 'model'> | null) => void) | null) {
		this.#onChildInfoChange = cb
	}

	constructor(socket: SocketWrapper) {
		super()

		this.#socket = socket

		this.#socket.on('dataCora', (data) => {
			let singletonCommand: QueuedCommand | undefined

			if (data.payload[0] === 0x01 && data.payload[1] === 0x0b) {
				// Query about Device 2
				singletonCommand = this.#pendingSingletonCommands.get(0x1c)

				if (!singletonCommand && this.#onChildInfoChange) {
					// If there is no command, this is a plug event
					this.#onChildInfoChange(parseDevice2Info(data.payload))
				}
			} else if (data.payload[0] === 0x01) {
				this.emit('input', data.payload.subarray(1))
			} else if (
				data.messageId &&
				(data.flags === CoraMessageFlags.ACK_NAK ||
					data.flags === ((CoraMessageFlags.ACK_NAK | CoraMessageFlags.VERBATIM) as CoraMessageFlags))
			) {
				const ackCommand = this.#inFlightAckCommands.get(data.messageId)
				if (ackCommand) {
					setImmediate(() => ackCommand.resolve(data.payload))
				}
			} else if (data.flags & CoraMessageFlags.VERBATIM) {
				// Command for the Device 2 port
				singletonCommand = this.#pendingSingletonCommands.get(data.payload[0])
			} else {
				// Command for the Studio port
				singletonCommand = this.#pendingSingletonCommands.get(data.payload[1])
			}

			if (singletonCommand) {
				const singletonCommand0 = singletonCommand
				setImmediate(() => singletonCommand0.resolve(data.payload))
			}
		})
		this.#socket.on('error', (message, err) =>
			this.emit('error', `Socket error: ${message} (${err?.message ?? err})`),
		)
		this.#socket.on('disconnected', () => {
			for (const command of this.#pendingSingletonCommands.values()) {
				try {
					command.reject(new Error('Disconnected'))
				} catch (_e) {
					// Ignore
				}
			}
			this.#pendingSingletonCommands.clear()

			for (const command of this.#inFlightAckCommands.values()) {
				try {
					command.reject(new Error('Disconnected'))
				} catch (_e) {
					// Ignore
				}
			}
			this.#inFlightAckCommands.clear()

			for (const { command } of this.#ackCommandQueue) {
				try {
					command.reject(new Error('Disconnected'))
				} catch (_e) {
					// Ignore
				}
			}
			this.#ackCommandQueue.length = 0
		})
	}

	async close(): Promise<void> {
		throw new Error('Socket is owned by the connection manager, and cannot be closed directly')
		// await this.#socket.close()
	}

	async sendFeatureReport(payload: Uint8Array): Promise<void> {
		// Prepare an error, to capture the stack trace
		const timeoutError = new Error('Timeout')
		// eslint-disable-next-line no-self-assign
		timeoutError.stack = timeoutError.stack

		await this.#enqueueAckCommand(timeoutError, (messageId) => {
			this.#socket.sendCoraWrites([
				{
					flags: (CoraMessageFlags.VERBATIM | CoraMessageFlags.REQ_ACK) as CoraMessageFlags,
					hidOp: CoraHidOp.SEND_REPORT,
					messageId,
					payload,
				},
			])
		})
	}

	async getFeatureReport(reportId: number, reportLength: number): Promise<Uint8Array> {
		return this.#executeSingletonCommand(reportId, reportLength, this.#isPrimary)
	}

	#nextMessageId = FIRST_STAN
	#getNextMessageId(): number {
		const id = this.#nextMessageId++
		if (this.#nextMessageId > 0xffffffff) this.#nextMessageId = FIRST_STAN // Wrap around, avoiding the reserved range
		return id
	}

	static readonly #MAX_ACK_IN_FLIGHT = 1 // TODO - try and set this higher, but start with this to be safe
	readonly #inFlightAckCommands = new Map<number, QueuedCommand>()
	readonly #ackCommandQueue: Array<{
		command: QueuedCommand
		timeoutError: Error
		send: (messageId: number) => void
	}> = []

	async #enqueueAckCommand(timeoutError: Error, send: (messageId: number) => void): Promise<Uint8Array> {
		const command = new QueuedCommand(0) // Really just a manual promise for us

		if (this.#inFlightAckCommands.size < TcpCoraHidDevice.#MAX_ACK_IN_FLIGHT) {
			this.#dispatchAckCommand(command, timeoutError, send)
		} else {
			this.#ackCommandQueue.push({ command, timeoutError, send })
		}

		return command.promise
	}

	#dispatchAckCommand(command: QueuedCommand, timeoutError: Error, send: (messageId: number) => void): void {
		const messageId = this.#getNextMessageId()
		this.#inFlightAckCommands.set(messageId, command)

		// Timeout starts here, when the packet is actually sent
		const timeoutId = setTimeout(() => command.reject(timeoutError), 5000)

		command.promise
			.finally(() => {
				clearTimeout(timeoutId)
				this.#inFlightAckCommands.delete(messageId)
				this.#processAckQueue()
			})
			.catch(() => null)

		send(messageId)
	}

	#processAckQueue(): void {
		if (this.#inFlightAckCommands.size >= TcpCoraHidDevice.#MAX_ACK_IN_FLIGHT) return

		const next = this.#ackCommandQueue.shift()
		if (!next) return

		this.#dispatchAckCommand(next.command, next.timeoutError, next.send)
	}
	readonly #pendingSingletonCommands = new Map<number, QueuedCommand>()
	async #executeSingletonCommand(commandType: number, reportLength: number, toHost: boolean): Promise<Uint8Array> {
		// if (!this.connected) throw new Error('Not connected')

		let payload: Buffer
		if (toHost) {
			payload = Buffer.alloc(Math.max(reportLength, 2))
			payload.writeUint8(0x03, 0) // Report ID 3 is the "get" report for the primary port
			payload.writeUint8(commandType, 1)
		} else {
			payload = Buffer.alloc(Math.max(reportLength, 1))
			payload.writeUint8(commandType, 0)
		}

		// nocommit this should sometimes REQ_ACK
		const msg: SocketCoraMessage = {
			flags: toHost ? CoraMessageFlags.NONE : CoraMessageFlags.VERBATIM,
			hidOp: CoraHidOp.GET_REPORT,
			messageId: this.#getNextMessageId(),
			payload: payload,
		}

		const command = new QueuedCommand(commandType)
		this.#pendingSingletonCommands.set(commandType, command)

		command.promise
			.finally(() => {
				this.#pendingSingletonCommands.delete(commandType)
			})
			.catch(() => null)

		this.#socket.sendCoraWrites([msg])

		return this.#executeWithTimeout(command, 5000)
	}

	async #executeWithTimeout(command: QueuedCommand, timeout: number): Promise<Uint8Array> {
		// TODO - improve this timeout
		const timeoutError = new Error('Timeout')
		// eslint-disable-next-line no-self-assign
		timeoutError.stack = timeoutError.stack // Ensure stack is captured here
		const timeoutId = setTimeout(() => {
			command.reject(timeoutError)
		}, timeout)

		try {
			return await command.promise
		} finally {
			clearTimeout(timeoutId)
		}
	}

	async sendReports(buffers: Buffer[]): Promise<void> {
		// Prepare an error, to capture the stack trace
		const timeoutError = new Error('Timeout')
		// eslint-disable-next-line no-self-assign
		timeoutError.stack = timeoutError.stack

		await this.#enqueueAckCommand(timeoutError, (lastMessageId) => {
			this.#socket.sendCoraWrites(
				buffers.map((buffer, index) => ({
					// This should be a single 'command', so only req_ack the last packet.
					flags: (index === buffers.length - 1
						? CoraMessageFlags.VERBATIM | CoraMessageFlags.REQ_ACK
						: CoraMessageFlags.VERBATIM) as CoraMessageFlags,
					hidOp: CoraHidOp.WRITE,
					messageId: index === buffers.length - 1 ? lastMessageId : 0,
					payload: buffer,
				})),
			)
		})
	}

	#loadedHidInfo: HIDDeviceInfo | undefined
	async getDeviceInfo(): Promise<HIDDeviceInfo> {
		// Cache once loaded. This is a bit of a race condition, but with minimal impact as we already run it before handling the class off anywhere
		if (this.#loadedHidInfo) return this.#loadedHidInfo

		// const deviceInfo = await Promise.race([
		// 	// primary port
		// 	this.#executeSingletonCommand(0x80, true).then((data) => ({ data, isPrimary: true })),
		// 	// secondary port
		// 	this.#executeSingletonCommand(0x08, false).then((data) => ({ data, isPrimary: false })),
		// ])
		// Future: this internal mutation is a bit of a hack, but it avoids needing to duplicate the singleton logic
		this.#isPrimary = this.#socket.port < 20000

		const devicePath = `tcp://${this.#socket.address}:${this.#socket.port}`

		if (this.#isPrimary) {
			const deviceInfo = await this.#executeSingletonCommand(0x80, 32, true)

			const dataView = uint8ArrayToDataView(deviceInfo)
			const vendorId = dataView.getUint16(12, true)
			const productId = dataView.getUint16(14, true)

			this.#loadedHidInfo = {
				vendorId: vendorId,
				productId: productId,
				path: devicePath,
			}
		} else {
			// const rawDevice2Info = await this.#executeSingletonCommand(0x1c, 2, true)
			// const device2Info = parseDevice2Info(rawDevice2Info)
			// if (!device2Info) throw new Error('Failed to get Device info')

			// HACK: force it to specific streamdeck
			this.#loadedHidInfo = {
				vendorId: VENDOR_ID, //device2Info.vendorId,
				productId: 0x008f, // device2Info.productId,
				path: devicePath,
			}
		}

		return this.#loadedHidInfo
	}

	async getChildDeviceInfo(): Promise<ChildHIDDeviceInfo | null> {
		if (!this.#isPrimary) return null

		const device2Info = await this.#executeSingletonCommand(0x1c, 2, true)

		return parseDevice2Info(device2Info)
	}
}
