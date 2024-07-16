import { HIDDevice } from '../hid-device'
import { OpenStreamDeckOptions, StreamDeckBase, StreamDeckGen1Properties, StreamDeckProperties } from './base'
import { StreamdeckDefaultImageWriter } from '../services/imageWriter/imageWriter'
import { StreamdeckGen1ImageHeaderGenerator } from '../services/imageWriter/headerGenerator'
import { StreamdeckImageWriter } from '../services/imageWriter/types'

function extendDevicePropertiesForGen1(rawProps: StreamDeckGen1Properties): StreamDeckProperties {
	return {
		...rawProps,
		KEY_DATA_OFFSET: 0,
		TOUCH_BUTTONS: 0,
		ENCODER_COUNT: 0,
	}
}

/**
 * Base class for generation 1 hardware (before the xl)
 */
export abstract class StreamDeckGen1Base extends StreamDeckBase {
	constructor(
		device: HIDDevice,
		options: Required<OpenStreamDeckOptions>,
		properties: StreamDeckGen1Properties,
		imageWriter?: StreamdeckImageWriter
	) {
		super(
			device,
			options,
			extendDevicePropertiesForGen1(properties),
			imageWriter ?? new StreamdeckDefaultImageWriter(new StreamdeckGen1ImageHeaderGenerator())
		)
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
