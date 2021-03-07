/**
 * The expected interface for a HIDDevice.
 * This is to be implemented by any wrapping libraries to translate their platform specific devices into a common and simpler form
 */
export interface HIDDevice {
	dataKeyOffset?: number

	on(event: 'error', handler: (data: any) => void): this
	on(event: 'input', handler: (keys: number[]) => void): this

	close(): Promise<void>

	sendFeatureReport(data: Buffer): Promise<void>
	getFeatureReport(reportId: number, reportLength: number): Promise<Buffer>

	sendReports(buffers: Buffer[]): Promise<void>
}
