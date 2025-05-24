import * as EventEmitter from 'events'
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
 * A HIDDevice implementation for TCP connections
 * This isn't really HID, but it fits the existing structure well enough
 * Note: this gets destroyed when the socket is closed, so we can rely on this for resetting the state
 */
export class TcpLegacyHidDevice extends EventEmitter<HIDDeviceEvents> implements TcpHidDevice {
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

		this.#socket.on('data', (data) => {
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
			} else if (data[0] === 0x03) {
				// Command for the Studio port
				singletonCommand = this.#pendingSingletonCommands.get(data[1])
			} else {
				// Command for the Device 2 port
				singletonCommand = this.#pendingSingletonCommands.get(data[0])
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

	async sendFeatureReport(data: Uint8Array): Promise<void> {
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
		// if (!this.connected) throw new Error('Not connected')

		const existingCommand = this.#pendingSingletonCommands.get(commandType)
		if (existingCommand) return existingCommand.promise

		const command = new QueuedCommand(commandType)
		this.#pendingSingletonCommands.set(commandType, command)

		command.promise
			.finally(() => {
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
		this.#socket.sendLegacyWrites([b])

		// TODO - improve this timeout
		setTimeout(() => {
			command.reject(new Error('Timeout'))
		}, 5000)

		return command.promise
	}

	async sendReports(buffers: Buffer[]): Promise<void> {
		this.#socket.sendLegacyWrites(buffers)
	}

	#loadedHidInfo: HIDDeviceInfo | undefined
	async getDeviceInfo(): Promise<HIDDeviceInfo> {
		// Cache once loaded. This is a bit of a race condition, but with minimal impact as we already run it before handling the class off anywhere
		if (this.#loadedHidInfo) return this.#loadedHidInfo

		const deviceInfo = await Promise.race([
			// primary port
			this.#executeSingletonCommand(0x80, true).then((data) => ({ data, isPrimary: true })),
			// secondary port
			this.#executeSingletonCommand(0x08, false).then((data) => ({ data, isPrimary: false })),
		])
		// Future: this internal mutation is a bit of a hack, but it avoids needing to duplicate the singleton logic
		this.#isPrimary = deviceInfo.isPrimary

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
			const rawDevice2Info = await this.#executeSingletonCommand(0x1c, true)
			const device2Info = parseDevice2Info(rawDevice2Info)
			if (!device2Info) throw new Error('Failed to get Device info')

			this.#loadedHidInfo = {
				vendorId: device2Info.vendorId,
				productId: device2Info.productId,
				path: devicePath,
			}
		}

		return this.#loadedHidInfo
	}

	async getChildDeviceInfo(): Promise<ChildHIDDeviceInfo | null> {
		if (!this.#isPrimary) return null

		const device2Info = await this.#executeSingletonCommand(0x1c, true)

		return parseDevice2Info(device2Info)
	}
}
