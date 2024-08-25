import type { HIDDevice } from '../../hid-device.js'
import type { PropertiesService } from './interface.js'

export class Gen2PropertiesService implements PropertiesService {
	readonly #device: HIDDevice

	constructor(device: HIDDevice) {
		this.#device = device
	}

	public async setBrightness(percentage: number): Promise<void> {
		if (percentage < 0 || percentage > 100) {
			throw new RangeError('Expected brightness percentage to be between 0 and 100')
		}

		// prettier-ignore
		const brightnessCommandBuffer = new Uint8Array([
			0x03,
			0x08, percentage, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		]);
		await this.#device.sendFeatureReport(brightnessCommandBuffer)
	}

	public async resetToLogo(): Promise<void> {
		// prettier-ignore
		const resetCommandBuffer = new Uint8Array([
			0x03,
			0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		]);
		await this.#device.sendFeatureReport(resetCommandBuffer)
	}

	public async getFirmwareVersion(): Promise<string> {
		const val = await this.#device.getFeatureReport(5, 32)
		const end = val[1] + 2
		return new TextDecoder('ascii').decode(val.subarray(6, end))
	}

	public async getSerialNumber(): Promise<string> {
		const val = await this.#device.getFeatureReport(6, 32)
		const end = val[1] + 2
		return new TextDecoder('ascii').decode(val.subarray(2, end))
	}
}
