import { HIDDevice } from '../device'
import { transformImageBuffer } from '../util'
import {
	EncodeJPEGHelper,
	InternalFillImageOptions,
	OpenStreamDeckOptions,
	StreamDeckBase,
	StreamDeckGen2Properties,
	StreamDeckProperties,
} from './base'
import { StreamdeckDefaultImageWriter } from '../services/imageWriter/imageWriter'
import { StreamdeckGen2ImageHeaderGenerator } from '../services/imageWriter/headerGenerator'
import type { StreamDeckLcdStripService, StreamDeckLcdStripServiceInternal } from '../types'
import { EncoderInputService } from '../services/encoder'

function extendDevicePropertiesForGen2(rawProps: StreamDeckGen2Properties): StreamDeckProperties {
	return {
		...rawProps,
		KEY_DATA_OFFSET: 3,
		KEY_DIRECTION: 'ltr',
		SUPPORTS_RGB_KEY_FILL: true,
	}
}

/**
 * Base class for generation 2 hardware (starting with the xl)
 */
export abstract class StreamDeckGen2Base extends StreamDeckBase {
	protected readonly encodeJPEG: EncodeJPEGHelper
	protected readonly xyFlip: boolean

	protected readonly lcdStripService: StreamDeckLcdStripServiceInternal | null
	protected readonly encoderService: EncoderInputService

	override get lcdStrip(): StreamDeckLcdStripService | null {
		return this.lcdStripService
	}

	constructor(
		device: HIDDevice,
		options: Required<OpenStreamDeckOptions>,
		properties: StreamDeckGen2Properties,
		lcdStripService: StreamDeckLcdStripServiceInternal | null,
		disableXYFlip?: boolean
	) {
		super(
			device,
			options,
			extendDevicePropertiesForGen2(properties),
			new StreamdeckDefaultImageWriter(new StreamdeckGen2ImageHeaderGenerator())
		)

		this.encodeJPEG = options.encodeJPEG
		this.xyFlip = !disableXYFlip

		this.lcdStripService = lcdStripService
		this.encoderService = new EncoderInputService(this, this.NUM_ENCODERS)
	}

	protected handleInputBuffer(data: Uint8Array): void {
		const inputType = data[0]
		switch (inputType) {
			case 0x00: // Button
				super.handleInputBuffer(data)
				break
			case 0x02: // LCD
				this.lcdStripService?.handleInput(data)
				break
			case 0x03: // Encoder
				this.encoderService.handleInput(data)
				break
		}
	}

	protected clearPanelInner(): Promise<void>[] {
		const ps = super.clearPanelInner()

		if (this.lcdStripService) {
			const lcdSize = this.lcdStripService.LCD_STRIP_SIZE
			const buffer = Buffer.alloc(lcdSize.width * lcdSize.height * 4)
			ps.push(
				this.lcdStripService.fillLcd(buffer, {
					format: 'rgba',
				})
			)
		}

		return ps
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
			0x03,
			0x08, percentage, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		])
		await this.device.sendFeatureReport(brightnessCommandBuffer)
	}

	public async resetToLogo(): Promise<void> {
		// prettier-ignore
		const resetCommandBuffer = Buffer.from([
			0x03,
			0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		])
		await this.device.sendFeatureReport(resetCommandBuffer)
	}

	public async getFirmwareVersion(): Promise<string> {
		const val = await this.device.getFeatureReport(5, 32)
		const end = val.readUInt8(1) + 2
		return val.toString('ascii', 6, end)
	}

	public async getSerialNumber(): Promise<string> {
		const val = await this.device.getFeatureReport(6, 32)
		const end = val.readUInt8(1) + 2
		return val.toString('ascii', 2, end)
	}

	protected async convertFillImage(sourceBuffer: Buffer, sourceOptions: InternalFillImageOptions): Promise<Buffer> {
		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions,
			{ colorMode: 'rgba', xFlip: this.xyFlip, yFlip: this.xyFlip },
			0,
			this.BUTTON_WIDTH_PX,
			this.BUTTON_HEIGHT_PX
		)

		return this.encodeJPEG(byteBuffer, this.BUTTON_WIDTH_PX, this.BUTTON_HEIGHT_PX)
	}
}
