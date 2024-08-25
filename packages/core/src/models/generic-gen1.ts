import { HIDDevice } from '../hid-device.js'
import { OpenStreamDeckOptions, StreamDeckBase, StreamDeckProperties } from './base.js'
import { StreamdeckImageWriter } from '../services/imageWriter/types.js'
import { BMP_HEADER_LENGTH, FillImageTargetOptions, transformImageBuffer, writeBMPHeader } from '../util.js'
import {
	ButtonLcdImagePacker,
	DefaultButtonsLcdService,
	InternalFillImageOptions,
} from '../services/buttonsLcdDisplay.js'
import { PropertiesService } from '../services/propertiesService.js'

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
	bmpImagePPM: number,
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
				properties.BUTTON_HEIGHT_PX,
			),
			device,
			fullProperties,
		),
		null,
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

	public async convertPixelBuffer(
		sourceBuffer: Uint8Array,
		sourceOptions: InternalFillImageOptions,
	): Promise<Uint8Array> {
		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions,
			this.#targetOptions,
			BMP_HEADER_LENGTH,
			this.#imageWidth,
			this.#imageHeight,
		)
		writeBMPHeader(
			byteBuffer,
			this.#imageWidth,
			this.#imageHeight,
			byteBuffer.length - BMP_HEADER_LENGTH,
			this.#bmpImagePPM,
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

	public async getFirmwareVersion(): Promise<string> {
		let val: Uint8Array
		try {
			val = await this.#device.getFeatureReport(4, 32)
		} catch (_e) {
			// In case some devices can't handle the different report length
			val = await this.#device.getFeatureReport(4, 17)
		}
		const end = val.indexOf(0, 5)
		return new TextDecoder('ascii').decode(val.subarray(5, end === -1 ? undefined : end))
	}

	public async getSerialNumber(): Promise<string> {
		let val: Uint8Array
		try {
			val = await this.#device.getFeatureReport(3, 32)
		} catch (_e) {
			// In case some devices can't handle the different report length
			val = await this.#device.getFeatureReport(3, 17)
		}
		return new TextDecoder('ascii').decode(val.subarray(5, 17))
	}
}
