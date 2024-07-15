import { HIDDevice } from '../device'
import { EncodeJPEGHelper, InternalFillImageOptions, OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { DeviceModelId } from '../id'
import { StreamDeckGen2Base } from './base-gen2'
import { StreamdeckDefaultImageWriter } from '../imageWriter/imageWriter'
import { StreamdeckNeoLcdImageHeaderGenerator } from '../imageWriter/headerGenerator'
import { FillImageOptions, FillLcdImageOptions, LcdSegmentSize, StreamDeckLcdStripService } from '../types'
import { transformImageBuffer } from '../util'

const neoProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.NEO,
	PRODUCT_NAME: 'Streamdeck Neo',
	COLUMNS: 4,
	ROWS: 2,
	TOUCH_BUTTONS: 2,
	ICON_SIZE: 96,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 3,
	ENCODER_COUNT: 0,

	KEY_SPACING_HORIZONTAL: 30,
	KEY_SPACING_VERTICAL: 30,
}

export class StreamDeckNeo extends StreamDeckGen2Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, neoProperties, new StreamDeckNeoLcdService(options.encodeJPEG, device))
	}
}

class StreamDeckNeoLcdService implements StreamDeckLcdStripService {
	readonly #encodeJPEG: EncodeJPEGHelper
	readonly #device: HIDDevice

	readonly #lcdImageWriter = new StreamdeckDefaultImageWriter<null>(new StreamdeckNeoLcdImageHeaderGenerator())

	constructor(encodeJPEG: EncodeJPEGHelper, device: HIDDevice) {
		this.#encodeJPEG = encodeJPEG
		this.#device = device
	}

	async fillEncoderLcd(_index: number, _imageBuffer: Buffer, _sourceOptions: FillImageOptions): Promise<void> {
		throw new Error('Not supported for this model')
	}
	async fillLcdRegion(
		_x: number,
		_y: number,
		_imageBuffer: Buffer,
		_sourceOptions: FillLcdImageOptions
	): Promise<void> {
		throw new Error('Not supported for this model')
	}

	public get LCD_STRIP_SIZE(): LcdSegmentSize {
		return {
			width: 248,
			height: 58,
		}
	}
	public get LCD_ENCODER_SIZE(): LcdSegmentSize | undefined {
		return undefined
	}

	public handleInput(_data: Uint8Array): void {
		// No input supported
	}

	public async fillLcd(imageBuffer: Buffer, sourceOptions: FillImageOptions): Promise<void> {
		const size = this.LCD_STRIP_SIZE
		if (!size) throw new Error(`There is no lcd to fill`)

		const imageSize = size.width * size.height * sourceOptions.format.length
		if (imageBuffer.length !== imageSize) {
			throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`)
		}

		// A lot of this drawing code is heavily based on the normal button
		const byteBuffer = await this.convertFillLcdBuffer(imageBuffer, size, sourceOptions)

		const packets = this.#lcdImageWriter.generateFillImageWrites(null, byteBuffer)
		await this.#device.sendReports(packets)
	}

	private async convertFillLcdBuffer(
		sourceBuffer: Buffer,
		size: LcdSegmentSize,
		sourceOptions: FillImageOptions
	): Promise<Buffer> {
		const sourceOptions2: InternalFillImageOptions = {
			format: sourceOptions.format,
			offset: 0,
			stride: size.width * sourceOptions.format.length,
		}

		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions2,
			{ colorMode: 'rgba', xFlip: true, yFlip: true },
			0,
			size.width,
			size.height
		)

		return this.#encodeJPEG(byteBuffer, size.width, size.height)
	}
}
