import { HIDDevice } from '../hid-device'
import { OpenStreamDeckOptions, StreamDeckBase, StreamDeckProperties } from './base'
import { StreamdeckImageWriter } from '../services/imageWriter/types'
import { BMP_HEADER_LENGTH, FillImageTargetOptions, transformImageBuffer, writeBMPHeader } from '../util'
import { ButtonLcdImagePacker, DefaultButtonsLcdService, InternalFillImageOptions } from '../services/buttonsLcdDisplay'
import { PropertiesService } from '../services/propertiesService'

function extendDevicePropertiesForGen1(rawProps: StreamDeckGen1Properties): StreamDeckProperties {
	return {
		...rawProps,
		KEY_DATA_OFFSET: 0,
	}
}

export type StreamDeckGen1Properties = Omit<StreamDeckProperties, 'KEY_DATA_OFFSET'>

export function StreamDeckGen1Factory(
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	properties: StreamDeckGen1Properties,
	imageWriter: StreamdeckImageWriter,
	targetOptions: FillImageTargetOptions,
	bmpImagePPM: number
): StreamDeckBase {
	const fullProperties = extendDevicePropertiesForGen1(properties)

	return new StreamDeckBase(
		device,
		options,
		fullProperties,
		new Gen1PropertiesService(device),
		new DefaultButtonsLcdService(
			imageWriter,
			new Gen1ButtonLcdImagePacker(
				targetOptions,
				bmpImagePPM,
				properties.BUTTON_WIDTH_PX,
				properties.BUTTON_HEIGHT_PX
			),
			device,
			fullProperties
		),
		null
	)
}

class Gen1ButtonLcdImagePacker implements ButtonLcdImagePacker {
	readonly #targetOptions: FillImageTargetOptions
	readonly #bmpImagePPM: number
	readonly #imageWidth: number
	readonly #imageHeight: number

	constructor(targetOptions: FillImageTargetOptions, bmpImagePPM: number, imageWidth: number, imageHeight: number) {
		this.#targetOptions = targetOptions
		this.#bmpImagePPM = bmpImagePPM
		this.#imageWidth = imageWidth
		this.#imageHeight = imageHeight
	}

	get imageWidth(): number {
		return this.#imageWidth
	}

	get imageHeight(): number {
		return this.#imageHeight
	}

	public async convertPixelBuffer(sourceBuffer: Buffer, sourceOptions: InternalFillImageOptions): Promise<Buffer> {
		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions,
			this.#targetOptions,
			BMP_HEADER_LENGTH,
			this.#imageWidth,
			this.#imageHeight
		)
		writeBMPHeader(
			byteBuffer,
			this.#imageWidth,
			this.#imageHeight,
			byteBuffer.length - BMP_HEADER_LENGTH,
			this.#bmpImagePPM
		)
		return byteBuffer
	}
}

class Gen1PropertiesService implements PropertiesService {
	readonly #device: HIDDevice

	constructor(device: HIDDevice) {
		this.#device = device
	}

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
		await this.#device.sendFeatureReport(brightnessCommandBuffer)
	}

	public async resetToLogo(): Promise<void> {
		// prettier-ignore
		const resetCommandBuffer = Buffer.from([
			0x0b,
			0x63, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		])
		await this.#device.sendFeatureReport(resetCommandBuffer)
	}

	public async getFirmwareVersion(): Promise<string> {
		let val: Buffer
		try {
			val = await this.#device.getFeatureReport(4, 32)
		} catch (e) {
			// In case some devices can't handle the different report length
			val = await this.#device.getFeatureReport(4, 17)
		}
		const end = val.indexOf(0, 5)
		return val.toString('ascii', 5, end === -1 ? undefined : end)
	}

	public async getSerialNumber(): Promise<string> {
		let val: Buffer
		try {
			val = await this.#device.getFeatureReport(3, 32)
		} catch (e) {
			// In case some devices can't handle the different report length
			val = await this.#device.getFeatureReport(3, 17)
		}
		return val.toString('ascii', 5, 17)
	}
}
