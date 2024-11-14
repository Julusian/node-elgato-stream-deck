import { Gen2PropertiesService } from './gen2'

export class StudioPropertiesService extends Gen2PropertiesService {
	public async getAllFirmwareVersions(): Promise<Record<string, string>> {
		// Not supported for most models
		return {}
	}
}
