import { transformImageBuffer } from '../util'
import {
	FillImageOptions,
	FillLcdImageOptions,
	LcdPosition,
	LcdSegmentSize,
	StreamDeckEvents,
	StreamDeckLcdStripService,
} from '../types'
import { HIDDevice } from '../device'
import { EncodeJPEGHelper, InternalFillImageOptions, OpenStreamDeckOptions, StreamDeckGen2Properties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId, EncoderIndex } from '../id'
import { StreamdeckDefaultImageWriter } from '../imageWriter/imageWriter'
import { StreamdeckPlusLcdImageHeaderGenerator } from '../imageWriter/headerGenerator'

const plusProperties: StreamDeckGen2Properties = {
	MODEL: DeviceModelId.PLUS,
	PRODUCT_NAME: 'Streamdeck +',
	COLUMNS: 4,
	ROWS: 2,
	TOUCH_BUTTONS: 0,
	BUTTON_WIDTH_PX: 120,
	BUTTON_HEIGHT_PX: 120,
	ENCODER_COUNT: 4,

	KEY_SPACING_HORIZONTAL: 99,
	KEY_SPACING_VERTICAL: 40,
}

export class StreamDeckPlus extends StreamDeckGen2Base {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(
			device,
			options,
			plusProperties,
			new StreamDeckPlusLcdService(
				options.encodeJPEG,
				device,
				(key, ...args) => this.emit(key, ...args),
				plusProperties.ENCODER_COUNT
			),
			true
		)
	}
}

class StreamDeckPlusLcdService implements StreamDeckLcdStripService {
	readonly #encodeJPEG: EncodeJPEGHelper
	readonly #device: HIDDevice

	readonly #lcdImageWriter = new StreamdeckDefaultImageWriter(new StreamdeckPlusLcdImageHeaderGenerator())

	readonly #emitEvent: SomeEmitEventFn
	readonly #encoderCount: number

	constructor(encodeJPEG: EncodeJPEGHelper, device: HIDDevice, emitEvent: SomeEmitEventFn, encoderCount: number) {
		this.#encodeJPEG = encodeJPEG
		this.#device = device
		this.#emitEvent = emitEvent
		this.#encoderCount = encoderCount
	}

	public get LCD_STRIP_SIZE(): LcdSegmentSize {
		const size = this.LCD_ENCODER_SIZE
		size.width *= this.#encoderCount
		return size
	}
	public get LCD_ENCODER_SIZE(): LcdSegmentSize {
		return { width: 200, height: 100 }
	}

	private calculateEncoderForX(x: number): EncoderIndex {
		const encoderWidth = this.LCD_ENCODER_SIZE.width
		return Math.floor(x / encoderWidth)
	}

	public handleInput(data: Uint8Array): void {
		const buffer = Buffer.from(data)
		const position: LcdPosition = {
			x: buffer.readUint16LE(5),
			y: buffer.readUint16LE(7),
		}
		const index = this.calculateEncoderForX(position.x)

		switch (data[3]) {
			case 0x01: // short press
				this.#emitEvent('lcdShortPress', index, position)
				break
			case 0x02: // long press
				this.#emitEvent('lcdLongPress', index, position)
				break
			case 0x03: {
				// swipe
				const position2: LcdPosition = {
					x: buffer.readUint16LE(9),
					y: buffer.readUint16LE(11),
				}
				const index2 = this.calculateEncoderForX(position2.x)
				this.#emitEvent('lcdSwipe', index, index2, position, position2)
				break
			}
		}
	}

	public async fillLcd(buffer: Buffer, sourceOptions: FillImageOptions): Promise<void> {
		const size = this.LCD_STRIP_SIZE
		if (!size) throw new Error(`There is no lcd to fill`)

		return this.fillLcdRegion(0, 0, buffer, {
			format: sourceOptions.format,
			width: size.width,
			height: size.height,
		})
	}

	public async fillEncoderLcd(index: EncoderIndex, buffer: Buffer, sourceOptions: FillImageOptions): Promise<void> {
		if (this.#encoderCount === 0) throw new Error(`There are no encoders`)

		const size = this.LCD_ENCODER_SIZE
		const x = index * size.width

		return this.fillLcdRegion(x, 0, buffer, {
			format: sourceOptions.format,
			width: size.width,
			height: size.height,
		})
	}

	public async fillLcdRegion(
		x: number,
		y: number,
		imageBuffer: Buffer,
		sourceOptions: FillLcdImageOptions
	): Promise<void> {
		// Basic bounds checking
		const maxSize = this.LCD_STRIP_SIZE
		if (x < 0 || x + sourceOptions.width > maxSize.width) {
			throw new TypeError(`Image will not fit within the lcd strip`)
		}
		if (y < 0 || y + sourceOptions.height > maxSize.height) {
			throw new TypeError(`Image will not fit within the lcd strip`)
		}

		const imageSize = sourceOptions.width * sourceOptions.height * sourceOptions.format.length
		if (imageBuffer.length !== imageSize) {
			throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`)
		}

		// A lot of this drawing code is heavily based on the normal button
		const byteBuffer = await this.convertFillLcdBuffer(imageBuffer, sourceOptions)

		const packets = this.#lcdImageWriter.generateFillImageWrites({ ...sourceOptions, x, y }, byteBuffer)
		await this.#device.sendReports(packets)
	}

	private async convertFillLcdBuffer(sourceBuffer: Buffer, sourceOptions: FillLcdImageOptions): Promise<Buffer> {
		const sourceOptions2: InternalFillImageOptions = {
			format: sourceOptions.format,
			offset: 0,
			stride: sourceOptions.width * sourceOptions.format.length,
		}

		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions2,
			{ colorMode: 'rgba' },
			0,
			sourceOptions.width,
			sourceOptions.height
		)

		return this.#encodeJPEG(byteBuffer, sourceOptions.width, sourceOptions.height)
	}
}

type SomeEmitEventFn = EmitEventFn<keyof StreamDeckEvents>
type EmitEventFn<K extends keyof StreamDeckEvents> = (key: K, ...args: StreamDeckEvents[K]) => void
