import type { HIDDevice } from '../../hid-device.js'
import { parseAllFirmwareVersionsHelper } from './all-firmware.js'
import type { PropertiesService } from './interface.js'

export class NetworkDockPropertiesService implements PropertiesService {
	readonly #device: HIDDevice

	constructor(device: HIDDevice) {
		this.#device = device
	}

	public async setBrightness(_percentage: number): Promise<void> {
		// Noop
	}

	public async resetToLogo(): Promise<void> {
		// Noop
	}

	public async getFirmwareVersion(): Promise<string> {
		const data = await this.#device.getFeatureReport(0x83, -1)

		return new TextDecoder('ascii').decode(data.subarray(8, 16))
	}

	public async getAllFirmwareVersions(): Promise<Record<string, string>> {
		const [ap2Data] = await Promise.all([this.#device.getFeatureReport(0x83, -1)])

		return parseAllFirmwareVersionsHelper({
			ap2: ap2Data.slice(2),
			encoderAp2: null,
			encoderLd: null,
		})
	}

	public async getSerialNumber(): Promise<string> {
		const data = await this.#device.getFeatureReport(0x84, -1)

		const length = data[3]
		return new TextDecoder('ascii').decode(data.subarray(4, 4 + length))
	}
}
