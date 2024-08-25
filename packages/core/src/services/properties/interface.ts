export interface PropertiesService {
	setBrightness(percentage: number): Promise<void>

	resetToLogo(): Promise<void>

	getFirmwareVersion(): Promise<string>

	getSerialNumber(): Promise<string>
}
