import { HIDDevice } from '../hid-device'
import { InternalFillImageOptions, OpenStreamDeckOptions, StreamDeckBase, StreamDeckProperties } from './base'
import { StreamdeckDefaultImageWriter } from '../services/imageWriter/imageWriter'
import { StreamdeckGen1ImageHeaderGenerator } from '../services/imageWriter/headerGenerator'
import { StreamdeckImageWriter } from '../services/imageWriter/types'
import { BMP_HEADER_LENGTH, FillImageTargetOptions, transformImageBuffer, writeBMPHeader } from '../util'

function extendDevicePropertiesForGen1(rawProps: StreamDeckGen1Properties): StreamDeckProperties {
	return {
		...rawProps,
		KEY_DATA_OFFSET: 0,
		TOUCH_BUTTONS: 0,
		ENCODER_COUNT: 0,
	}
}

export type StreamDeckGen1Properties = Omit<StreamDeckProperties, 'KEY_DATA_OFFSET' | 'TOUCH_BUTTONS' | 'ENCODER_COUNT'>

/**
 * Class for generation 1 hardware (before the xl)
 */
export class StreamDeckGen1 extends StreamDeckBase {
	readonly #targetOptions: FillImageTargetOptions
	readonly #bmpImagePPM: number

	constructor(
		device: HIDDevice,
		options: Required<OpenStreamDeckOptions>,
		properties: StreamDeckGen1Properties,
		targetOptions: FillImageTargetOptions,
		bmpImagePPM: number,
		imageWriter?: StreamdeckImageWriter
	) {
		super(
			device,
			options,
			extendDevicePropertiesForGen1(properties),
			imageWriter ?? new StreamdeckDefaultImageWriter(new StreamdeckGen1ImageHeaderGenerator())
		)

		this.#targetOptions = targetOptions
		this.#bmpImagePPM = bmpImagePPM
	}

	protected async convertFillImage(sourceBuffer: Buffer, sourceOptions: InternalFillImageOptions): Promise<Buffer> {
		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions,
			this.#targetOptions,
			BMP_HEADER_LENGTH,
			this.BUTTON_WIDTH_PX,
			this.BUTTON_HEIGHT_PX
		)
		writeBMPHeader(
			byteBuffer,
			this.BUTTON_WIDTH_PX,
			this.BUTTON_HEIGHT_PX,
			this.BUTTON_RGB_BYTES,
			this.#bmpImagePPM
		)
		return byteBuffer
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
