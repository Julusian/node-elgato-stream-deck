import type { EventEmitter } from 'eventemitter3'

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

	sendFeatureReport(data: Uint8Array): Promise<void>
	getFeatureReport(reportId: number, reportLength: number): Promise<Uint8Array>

	/**
	 * Send multiple reports as a batch, to ensure they are sent together without other interleaving messages.
	 * Note: This should be called as one operation, and should not have multiple 'operations' within it.
	 * @param buffers
	 */
	sendReports(buffers: Uint8Array[]): Promise<void>

	getDeviceInfo(): Promise<HIDDeviceInfo>

	getChildDeviceInfo(): Promise<ChildHIDDeviceInfo | null>
}

export interface HIDDeviceInfo {
	readonly path: string | undefined
	readonly productId: number
	readonly vendorId: number
}

export interface ChildHIDDeviceInfo extends HIDDeviceInfo {
	readonly serialNumber: string
	readonly tcpPort: number
}
