import type { HIDDevice } from '../../hid-device.js'
import type { PropertiesService } from './interface.js'

export class Gen1PropertiesService implements PropertiesService {
	readonly #device: HIDDevice
	readonly #hasMiniFirmwareReports: boolean

	/**
	 * @param hasMiniFirmwareReports Whether the device has the firmware version reports of the Mini (0xa0 to 0xa2)
	 */
	constructor(device: HIDDevice, hasMiniFirmwareReports: boolean) {
		this.#device = device
		this.#hasMiniFirmwareReports = hasMiniFirmwareReports
	}

	public async setBrightness(percentage: number): Promise<void> {
		if (percentage < 0 || percentage > 100) {
			throw new RangeError('Expected brightness percentage to be between 0 and 100')
		}

		// prettier-ignore
		const brightnessCommandBuffer = new Uint8Array([
			0x05,
			0x55, 0xaa, 0xd1, 0x01, percentage, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		])
		await this.#device.sendFeatureReport(brightnessCommandBuffer)
	}

	public async resetToLogo(): Promise<void> {
		// prettier-ignore
		const resetCommandBuffer = new Uint8Array([
			0x0b,
			0x63, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		])
		await this.#device.sendFeatureReport(resetCommandBuffer)
	}

	async #readFirmwareVersionReport(reportId: number): Promise<string> {
		let val: Uint8Array
		try {
			val = await this.#device.getFeatureReport(reportId, 32)
		} catch (_e) {
			// In case some devices can't handle the different report length
			val = await this.#device.getFeatureReport(reportId, 17)
		}
		const end = val.indexOf(0, 5)
		return new TextDecoder('ascii').decode(val.subarray(5, end === -1 ? undefined : end))
	}

	public async getFirmwareVersion(): Promise<string> {
		if (this.#hasMiniFirmwareReports) {
			// Fall back to 0x04 if this report is empty or unsupported
			const version = await this.#readFirmwareVersionReport(0xa1).catch(() => '')
			if (version) return version
		}

		return this.#readFirmwareVersionReport(0x04)
	}

	public async getAllFirmwareVersions(): Promise<Record<string, string>> {
		// Not supported for gen1 models
		return {}
	}

	public async getSerialNumber(): Promise<string> {
		try {
			const val = await this.#device.getFeatureReport(3, 32)

			// At some point the serials changed from 12 to 14 chars. Not sure if this
			// aligned with a hardware revision or a firmware change.
			// So while it is messy, we attempt to handle both cases here
			let end = 5
			while (end < val.length && val[end] >= 0x20 && val[end] <= 0x7e) end++
			return new TextDecoder('ascii').decode(val.subarray(5, end))
		} catch (_e) {
			// In case some devices can't handle the different report length
			const val = await this.#device.getFeatureReport(3, 17)
			return new TextDecoder('ascii').decode(val.subarray(5, 17))
		}
	}
}
