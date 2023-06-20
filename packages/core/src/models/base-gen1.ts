import { HIDDevice } from '../device'
import { OpenStreamDeckOptions, StreamDeckBase, StreamDeckProperties } from './base'

/**
 * Base class for generation 1 hardware (before the xl)
 */
export abstract class StreamDeckGen1Base extends StreamDeckBase {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>, properties: StreamDeckProperties) {
		super(device, options, properties)
	}

	/**
	 * Sets the brightness of the keys on the Stream Deck
	 *
	 * @param {number} percentage The percentage brightness
	 */
	public async setBrightness(percentage: number): Promise<void> {
		if (percentage < 0 || percentage > 100) {
			throw new RangeError('Expected brightness percentage to be between 0 and 100')
		}

		// prettier-ignore
		const brightnessCommandBuffer = Buffer.from([
			0x05,
			0x55, 0xaa, 0xd1, 0x01, percentage, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		])
		await this.device.sendFeatureReport(brightnessCommandBuffer)
	}

	public async resetToLogo(): Promise<void> {
		// prettier-ignore
		const resetCommandBuffer = Buffer.from([
			0x0b,
			0x63, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		])
		await this.device.sendFeatureReport(resetCommandBuffer)
	}

	public async getFirmwareVersion(): Promise<string> {
		let val: Buffer
		try {
			val = await this.device.getFeatureReport(4, 32)
		} catch (e) {
			// In case some devices can't handle the different report length
			val = await this.device.getFeatureReport(4, 17)
		}
		const end = val.indexOf(0, 5)
		return val.toString('ascii', 5, end === -1 ? undefined : end)
	}

	public async getSerialNumber(): Promise<string> {
		let val: Buffer
		try {
			val = await this.device.getFeatureReport(3, 32)
		} catch (e) {
			// In case some devices can't handle the different report length
			val = await this.device.getFeatureReport(3, 17)
		}
		return val.toString('ascii', 5, 17)
	}
}
