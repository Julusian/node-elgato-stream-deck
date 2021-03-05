export interface HIDDevice {
	dataKeyOffset?: number

	on(event: 'error', handler: (data: any) => void): this
	on(event: 'input', handler: (keys: number[]) => void): this

	close(): Promise<void>

	sendFeatureReport(data: Buffer): Promise<void>
	getFeatureReport(reportId: number, reportLength: number): Promise<Buffer>

	sendReports(buffers: Buffer[]): Promise<void>
}
