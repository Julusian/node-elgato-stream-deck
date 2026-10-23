import { EventEmitter } from 'events'
import {
	type HIDDeviceInfo,
	type HIDDeviceEvents,
	type ChildHIDDeviceInfo,
	type StreamDeckTcpChildDeviceInfo,
	uint8ArrayToDataView,
} from '@elgato-stream-deck/core'
import type { SocketWrapper } from '../socketWrapper.js'
import { parseDevice2Info } from '../device2Info.js'
import { QueuedCommand } from './util.js'
import type { TcpHidDevice } from './api.js'

/**
 * How many times to query the device 2 info while identifying the port, before giving up waiting for it to settle
 */
const DEVICE_2_INFO_MAX_QUERIES = 5

/**
 * Is this the Studio's 'Feedback of number of client connections' (`03 8f`, with a data length of 2)?
 * The data length is checked too, as the bytes after the report id of a Mini serial number response vary
 */
function isClientCountFeedback(data: Uint8Array): boolean {
	return data[0] === 0x03 && data[1] === 0x8f && data[2] === 0x02 && data[3] === 0x00
}

/**
 * A HIDDevice implementation for TCP connections
 * This isn't really HID, but it fits the existing structure well enough
 * Note: this gets destroyed when the socket is closed, so we can rely on this for resetting the state
 */
export class TcpLegacyHidDevice extends EventEmitter<HIDDeviceEvents> implements TcpHidDevice {
	readonly #socket: SocketWrapper
	#isPrimary = true
	/**
	 * The socket is reused when reconnecting, so once this connection has been lost this device must stop writing to it.
	 * Otherwise it could write to a newer connection which belongs to another device instance
	 */
	#disconnected = false
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
		this.#disconnected = !socket.connected

		this.#socket.on('dataLegacy', (data) => {
			let singletonCommand: QueuedCommand | undefined

			if (data[0] === 0x01 && data[1] === 0x0b) {
				// Query about Device 2
				singletonCommand = this.#pendingSingletonCommands.get(0x1c)

				if (!singletonCommand && this.#onChildInfoChange) {
					// If there is no command, this is a plug event
					this.#onChildInfoChange(parseDevice2Info(data))
				}
			} else if (data[0] === 0x01) {
				this.emit('input', data.subarray(1))
			} else if (data[0] === 0x03 && (this.#isPrimary || isClientCountFeedback(data))) {
				// Command for the Studio port
				// Note: on the Device 2 port these are from the child, as the Mini uses report 0x03 for its serial number
				// Except for the client count, which the Studio sends on both ports whenever a client connects or disconnects
				singletonCommand = this.#pendingSingletonCommands.get(data[1])
			} else {
				// Command for the Device 2 port
				singletonCommand = this.#pendingSingletonCommands.get(data[0])

				// Unless it is a late answer to the device info, which means this was wrongly identified as the Device 2 port
				if (!singletonCommand && data[0] === 0x03 && data[1] === 0x80) {
					singletonCommand = this.#pendingSingletonCommands.get(0x80)
				}
			}

			if (singletonCommand) {
				const singletonCommand0 = singletonCommand
				setImmediate(() => singletonCommand0.resolve(data))
			}
		})
		this.#socket.on('error', (message, err) =>
			this.emit('error', `Socket error: ${message} (${err?.message ?? err})`),
		)
		this.#socket.on('disconnected', () => {
			this.#disconnected = true

			for (const command of this.#pendingSingletonCommands.values()) {
				try {
					command.reject(new Error('Disconnected'))
				} catch (_e) {
					// Ignore
				}
			}
			this.#pendingSingletonCommands.clear()
		})
	}

	async close(): Promise<void> {
		throw new Error('Socket is owned by the connection manager, and cannot be closed directly')
		// await this.#socket.close()
	}

	#assertConnected(): void {
		if (this.#disconnected) throw new Error('Disconnected')
	}

	async sendFeatureReport(data: Uint8Array): Promise<void> {
		this.#assertConnected()

		// Ensure the buffer is 1024 bytes long
		let dataFull = data
		if (data.length != 1024) {
			dataFull = new Uint8Array(1024)
			dataFull.set(data.slice(0, Math.min(data.length, dataFull.length)))
		}

		this.#socket.sendLegacyWrites([dataFull])
	}

	async getFeatureReport(reportId: number, _reportLength: number): Promise<Uint8Array> {
		return this.#executeSingletonCommand(reportId, this.#isPrimary)
	}

	readonly #pendingSingletonCommands = new Map<number, QueuedCommand>()
	async #executeSingletonCommand(commandType: number, isPrimary: boolean): Promise<Uint8Array> {
		this.#assertConnected()

		const existingCommand = this.#pendingSingletonCommands.get(commandType)
		if (existingCommand) return existingCommand.promise

		const command = new QueuedCommand(commandType)
		this.#pendingSingletonCommands.set(commandType, command)

		// TODO - improve this timeout
		const timeout = setTimeout(() => {
			command.reject(new Error('Timeout'))
		}, 5000)

		command.promise
			.finally(() => {
				clearTimeout(timeout)
				this.#pendingSingletonCommands.delete(commandType)
			})
			.catch(() => null)

		const b = Buffer.alloc(1024)
		if (isPrimary) {
			b.writeUint8(0x03, 0)
			b.writeUint8(commandType, 1)
		} else {
			b.writeUint8(commandType, 0)
		}
		try {
			this.#socket.sendLegacyWrites([b])
		} catch (e) {
			command.reject(e)
		}

		return command.promise
	}

	async sendReports(buffers: Buffer[]): Promise<void> {
		this.#assertConnected()

		this.#socket.sendLegacyWrites(buffers)
	}

	#loadedHidInfo: HIDDeviceInfo | undefined
	async getDeviceInfo(): Promise<HIDDeviceInfo> {
		// Cache once loaded. This is a bit of a race condition, but with minimal impact as we already run it before handling the class off anywhere
		if (this.#loadedHidInfo) return this.#loadedHidInfo

		// Only commands answered by the Studio itself can be used to identify the port, as on its primary port
		// the Studio mishandles commands for the child: 2.01 drops the next request after two of them in a row, and 2.02 closes the connection (#219)
		// Both ports answer the device 2 info, but only the primary port answers the device info
		let primaryAnswered = false
		const primaryInfoPromise = this.#executeSingletonCommand(0x80, true)
		const deviceInfo = await Promise.race([
			primaryInfoPromise.then((data) => {
				primaryAnswered = true
				return { data, isPrimary: true }
			}),
			this.#getSettledDevice2Info(() => primaryAnswered).then(async (data) => {
				// Without a child there is no secondary port, so this must be the primary port
				if (!parseDevice2Info(data)) return { data: await primaryInfoPromise, isPrimary: true }

				return { data, isPrimary: false }
			}),
		])
		// Future: this internal mutation is a bit of a hack, but it avoids needing to duplicate the singleton logic
		this.#isPrimary = deviceInfo.isPrimary

		if (!deviceInfo.isPrimary) {
			// This relies on the Studio answering in order, which isn't guaranteed. If the primary port answers after all, reconnect to identify it again
			primaryInfoPromise.then(
				() => {
					if (this.#disconnected) return

					this.emit('error', 'Wrongly identified as the Device 2 port, reconnecting')
					this.#socket.reconnect()
				},
				() => null,
			)
		}

		const devicePath = `tcp://${this.#socket.address}:${this.#socket.port}`

		if (this.#isPrimary) {
			const dataView = uint8ArrayToDataView(deviceInfo.data)
			const vendorId = dataView.getUint16(12, true)
			const productId = dataView.getUint16(14, true)

			this.#loadedHidInfo = {
				vendorId: vendorId,
				productId: productId,
				path: devicePath,
			}
		} else {
			const device2Info = parseDevice2Info(deviceInfo.data)
			if (!device2Info) throw new Error('Failed to get Device info')

			this.#loadedHidInfo = {
				vendorId: device2Info.vendorId,
				productId: device2Info.productId,
				path: devicePath,
			}
		}

		return this.#loadedHidInfo
	}

	/**
	 * Query the device 2 info until two responses in a row match
	 * Each query is sent once the previous response has arrived, so that a primary port has had at least a full round trip to answer the device info.
	 * Requiring a match ensures a hotplug event, which is indistinguishable from a response, can't be taken as the answer
	 * @param isPrimary Stop early once the port is known to be the primary, so later hotplug events are reported as such
	 */
	async #getSettledDevice2Info(isPrimary: () => boolean): Promise<Uint8Array> {
		let previous: Uint8Array | null = null
		for (let i = 0; i < DEVICE_2_INFO_MAX_QUERIES; i++) {
			const info = await this.#executeSingletonCommand(0x1c, true)
			if (isPrimary() || (previous && Buffer.compare(previous, info) === 0)) return info
			previous = info
		}

		throw new Error('Device 2 info did not settle')
	}

	async getChildDeviceInfo(): Promise<ChildHIDDeviceInfo | null> {
		if (!this.#isPrimary) return null

		const device2Info = await this.#executeSingletonCommand(0x1c, true)

		return parseDevice2Info(device2Info)
	}
}
