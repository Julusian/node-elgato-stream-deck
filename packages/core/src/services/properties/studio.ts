import { parseAllFirmwareVersionsHelper } from './all-firmware'
import { Gen2PropertiesService } from './gen2'

export class StudioPropertiesService extends Gen2PropertiesService {
	public async getAllFirmwareVersions(): Promise<Record<string, string>> {
		const [ap2Data, encoderAp2Data, encoderLdData] = await Promise.all([
			this.device.getFeatureReport(0x05, 32),
			this.device.getFeatureReport(0x11, 32),
			this.device.getFeatureReport(0x13, 32),
		])

		return parseAllFirmwareVersionsHelper({
			ap2: ap2Data,
			encoderAp2: encoderAp2Data,
			encoderLd: encoderLdData,
		})
	}
}
