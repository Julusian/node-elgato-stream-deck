export interface HIDDevice {
	dataKeyOffset?: number

	on(event: 'error', handler: (data: any) => void): this
	on(event: 'input', handler: (keys: boolean[]) => void): this

	close(): Promise<void>

	sendFeatureReport(data: number[]): Promise<void>
	getFeatureReport(reportId: number, reportLength: number): Promise<number[]>

	sendReport(data: number[]): Promise<void>
}
