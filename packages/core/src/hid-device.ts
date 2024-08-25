import type EventEmitter from 'eventemitter3'

export interface HIDDeviceEvents {
	error: [data: any]
	input: [keys: Uint8Array]
}

/**
 * The expected interface for a HIDDevice.
 * This is to be implemented by any wrapping libraries to translate their platform specific devices into a common and simpler form
 */
export interface HIDDevice extends EventEmitter<HIDDeviceEvents> {
	close(): Promise<void>

	sendFeatureReport(data: Buffer): Promise<void>
	getFeatureReport(reportId: number, reportLength: number): Promise<Buffer>

	sendReports(buffers: Buffer[]): Promise<void>

	getDeviceInfo(): Promise<HIDDeviceInfo>
}

export interface HIDDeviceInfo {
	path: string | undefined
	productId: number
	vendorId: number
}
