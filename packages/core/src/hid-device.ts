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

	/**
	 * Send a feature report to the device.
	 * The write is either sent in full or not at all. The signal is checked once, when the write is about to be sent (eg when it reaches the front of a write queue), and is never able to interrupt a write which has started.
	 * @param data The report to send, including the report id
	 * @param signal Signal to skip the write if it has not been sent yet, or null if it must not be skipped
	 * @returns true once the report has been sent to the device, false if it was skipped because the signal was aborted
	 */
	sendFeatureReport(data: Uint8Array, signal: AbortSignal | null): Promise<boolean>
	getFeatureReport(reportId: number, reportLength: number): Promise<Uint8Array>

	/**
	 * Send a group of reports to the device.
	 * The group is either sent in full or not at all. The signal is checked once, when the group is about to be sent (eg when it reaches the front of a write queue), and is never able to interrupt a group which has started.
	 * @param buffers The reports to send, each including the report id
	 * @param signal Signal to skip the write if it has not been sent yet, or null if it must not be skipped
	 * @returns true once the reports have been sent to the device, false if they were skipped because the signal was aborted
	 */
	sendReports(buffers: Uint8Array[], signal: AbortSignal | null): Promise<boolean>

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
