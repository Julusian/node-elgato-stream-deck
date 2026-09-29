import * as fs from 'fs'
import * as path from 'path'
import { EventEmitter } from 'events'
import type { SocketCoraMessage, SocketWrapper, SocketWrapperEvents } from '../socketWrapper.js'

export function readFixtureJSON(fileName: string): Buffer {
	const filePath = path.resolve(__dirname, '../../../../fixtures', fileName)
	const fileData = fs.readFileSync(filePath)
	return Buffer.from(JSON.parse(fileData.toString()) as Array<number>)
}

/**
 * A stand-in for SocketWrapper, which records what gets sent and lets tests inject received data
 */
export class FakeSocket extends EventEmitter<SocketWrapperEvents> {
	connected = true
	readonly address = '10.0.0.1'
	readonly port = 5343

	readonly sentCora: SocketCoraMessage[] = []
	readonly sentLegacy: Uint8Array[] = []

	sendCoraWrites(messages: SocketCoraMessage[]): void {
		this.sentCora.push(...messages)
	}

	sendLegacyWrites(buffers: Uint8Array[]): void {
		this.sentLegacy.push(...buffers)
	}

	asSocketWrapper(): SocketWrapper {
		return this as unknown as SocketWrapper
	}
}

export interface Device2InfoOptions {
	connected: boolean
	vendorId?: number
	productId?: number
	serialNumber?: string
	tcpPort?: number
}

/** Build a 'Device 2 info' report, as sent in response to 0x1c or when a child device is plugged in */
export function createDevice2Info(options: Device2InfoOptions): Buffer {
	const buffer = Buffer.alloc(128)
	buffer.writeUInt8(0x01, 0)
	buffer.writeUInt8(0x0b, 1)
	buffer.writeUInt8(options.connected ? 0x02 : 0x00, 4)
	buffer.writeUInt16LE(options.vendorId ?? 0, 26)
	buffer.writeUInt16LE(options.productId ?? 0, 28)
	buffer.write(options.serialNumber ?? '', 94, 31, 'ascii')
	buffer.writeUInt16LE(options.tcpPort ?? 0, 126)
	return buffer
}

/** Build the response to the 0x80 'device info' query made to a primary device */
export function createPrimaryDeviceInfo(vendorId: number, productId: number): Buffer {
	const buffer = Buffer.alloc(32)
	buffer.writeUInt8(0x03, 0)
	buffer.writeUInt8(0x80, 1)
	buffer.writeUInt16LE(vendorId, 12)
	buffer.writeUInt16LE(productId, 14)
	return buffer
}
