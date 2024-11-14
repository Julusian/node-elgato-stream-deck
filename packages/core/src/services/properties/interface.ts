export interface PropertiesService {
	setBrightness(percentage: number): Promise<void>

	resetToLogo(): Promise<void>

	getFirmwareVersion(): Promise<string>

	getAllFirmwareVersions(): Promise<Record<string, string>>

	getSerialNumber(): Promise<string>
}
