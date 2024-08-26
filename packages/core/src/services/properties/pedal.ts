import type { HIDDevice } from '../../hid-device.js'
import type { PropertiesService } from './interface.js'

export class PedalPropertiesService implements PropertiesService {
	readonly #device: HIDDevice

	constructor(device: HIDDevice) {
		this.#device = device
	}

	public async setBrightness(_percentage: number): Promise<void> {
		// Not supported
	}

	public async resetToLogo(): Promise<void> {
		// Not supported
	}

	public async getFirmwareVersion(): Promise<string> {
		const val = await this.#device.getFeatureReport(5, 32)
		const end = val.indexOf(0, 6)
		return new TextDecoder('ascii').decode(val.subarray(6, end === -1 ? undefined : end))
	}

	public async getSerialNumber(): Promise<string> {
		const val = await this.#device.getFeatureReport(6, 32)
		return new TextDecoder('ascii').decode(val.subarray(2, 14))
	}
}
