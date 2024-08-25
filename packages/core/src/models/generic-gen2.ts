import { HIDDevice } from '../hid-device.js'
import { transformImageBuffer } from '../util.js'
import { EncodeJPEGHelper, OpenStreamDeckOptions, StreamDeckProperties, StreamDeckServicesDefinition } from './base.js'
import { StreamdeckDefaultImageWriter } from '../services/imageWriter/imageWriter.js'
import { StreamdeckGen2ImageHeaderGenerator } from '../services/imageWriter/headerGenerator.js'
import { EncoderInputService } from '../services/encoderInput.js'
import {
	ButtonLcdImagePacker,
	DefaultButtonsLcdService,
	InternalFillImageOptions,
} from '../services/buttonsLcdDisplay.js'
import { PropertiesService } from '../services/propertiesService.js'
import { CallbackHook } from '../services/callback-hook.js'
import type { StreamDeckEvents } from '../types.js'

function extendDevicePropertiesForGen2(rawProps: StreamDeckGen2Properties): StreamDeckProperties {
	return {
		...rawProps,
		KEY_DATA_OFFSET: 3,
		SUPPORTS_RGB_KEY_FILL: true,
	}
}

export type StreamDeckGen2Properties = Omit<StreamDeckProperties, 'KEY_DATA_OFFSET' | 'SUPPORTS_RGB_KEY_FILL'>

export function createBaseGen2Properties(
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	properties: StreamDeckGen2Properties,
	disableXYFlip?: boolean,
): StreamDeckServicesDefinition & {
	// Always defined for Gen2
	events: CallbackHook<StreamDeckEvents>
} {
	const fullProperties = extendDevicePropertiesForGen2(properties)

	const events = new CallbackHook<StreamDeckEvents>()

	return {
		deviceProperties: fullProperties,
		events,
		properties: new Gen2PropertiesService(device),
		buttonsLcd: new DefaultButtonsLcdService(
			new StreamdeckDefaultImageWriter(new StreamdeckGen2ImageHeaderGenerator()),
			new Gen2ButtonLcdImagePacker(
				options.encodeJPEG,
				!disableXYFlip,
				properties.BUTTON_WIDTH_PX,
				properties.BUTTON_HEIGHT_PX,
			),
			device,
			fullProperties,
		),
		lcdStripDisplay: null,
		lcdStripInput: null,
		encoderInput: new EncoderInputService(events, properties.CONTROLS),
	}
}

class Gen2ButtonLcdImagePacker implements ButtonLcdImagePacker {
	readonly #encodeJPEG: EncodeJPEGHelper
	readonly #xyFlip: boolean
	readonly #imageWidth: number
	readonly #imageHeight: number

	constructor(encodeJPEG: EncodeJPEGHelper, xyFlip: boolean, imageWidth: number, imageHeight: number) {
		this.#encodeJPEG = encodeJPEG
		this.#xyFlip = xyFlip
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
			{ colorMode: 'rgba', xFlip: this.#xyFlip, yFlip: this.#xyFlip },
			0,
			this.#imageWidth,
			this.#imageHeight,
		)

		return this.#encodeJPEG(byteBuffer, this.#imageWidth, this.#imageHeight)
	}
}

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
		])
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
		])
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
