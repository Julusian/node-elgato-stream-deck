export interface PropertiesService {
	setBrightness(percentage: number, signal: AbortSignal | null): Promise<boolean>

	resetToLogo(): Promise<void>

	getFirmwareVersion(): Promise<string>

	getAllFirmwareVersions(): Promise<Record<string, string>>

	getSerialNumber(): Promise<string>
}
