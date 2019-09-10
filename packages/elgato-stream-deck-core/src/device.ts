export interface HIDDevice {
	on(event: 'data' | 'error', handler: (data: any) => void): this

	sendFeatureReport(data: number[]): Promise<void>
	getFeatureReport(reportId: number, reportLength: number): Promise<number[]>

	sendReport(data: number[]): Promise<void>
}
