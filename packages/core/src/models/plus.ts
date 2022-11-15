import { transformImageBuffer } from '../util'
import { FillImageOptions, FillLcdImageOptions, LcdPosition, LcdSegmentSize } from '../types'
import { HIDDevice } from '../device'
import { InternalFillImageOptions, OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId, EncoderIndex } from '../id'
import { StreamdeckDefaultImageWriter } from '../imageWriter/imageWriter'
import { StreamdeckPlusLcdImageHeaderGenerator } from '../imageWriter/headerGenerator'

const plusProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.PLUS,
	PRODUCT_NAME: 'Streamdeck +',
	COLUMNS: 4,
	ROWS: 2,
	TOUCH_BUTTONS: 0,
	ICON_SIZE: 120,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 3,

	KEY_SPACING_HORIZONTAL: 99,
	KEY_SPACING_VERTICAL: 40,
}

export class StreamDeckPlus extends StreamDeckGen2Base {
	readonly #lcdImageWriter = new StreamdeckDefaultImageWriter(new StreamdeckPlusLcdImageHeaderGenerator())
	readonly #encoderState: boolean[]

	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, plusProperties, true)

		this.#encoderState = new Array<boolean>(4).fill(false)
	}

	public get NUM_ENCODERS(): number {
		return 4
	}

	public get LCD_STRIP_SIZE(): LcdSegmentSize {
		const size = this.LCD_ENCODER_SIZE
		size.width *= this.NUM_ENCODERS
		return size
	}
	public get LCD_ENCODER_SIZE(): LcdSegmentSize {
		return { width: 200, height: 100 }
	}

	private calculateEncoderForX(x: number): EncoderIndex {
		const encoderWidth = this.LCD_ENCODER_SIZE.width
		return Math.floor(x / encoderWidth)
	}

	protected handleInputBuffer(data: Uint8Array): void {
		const inputType = data[0]
		switch (inputType) {
			case 0x00: // Button
				super.handleInputBuffer(data)
				break
			case 0x02: // LCD
				this.handleLcdInput(data)
				break
			case 0x03: // Encoder
				this.handleEncoderInput(data)
				break
		}
	}

	private handleLcdInput(data: Uint8Array): void {
		const buffer = Buffer.from(data)
		const position: LcdPosition = {
			x: buffer.readUint16LE(5),
			y: buffer.readUint16LE(7),
		}
		const index = this.calculateEncoderForX(position.x)

		switch (data[3]) {
			case 0x01: // short press
				this.emit('lcdShortPress', index, position)
				break
			case 0x02: // long press
				this.emit('lcdLongPress', index, position)
				break
			case 0x03: {
				// swipe
				const position2: LcdPosition = {
					x: buffer.readUint16LE(9),
					y: buffer.readUint16LE(11),
				}
				const index2 = this.calculateEncoderForX(position2.x)
				this.emit('lcdSwipe', index, index2, position, position2)
				break
			}
		}
	}

	private handleEncoderInput(data: Uint8Array): void {
		switch (data[3]) {
			case 0x00: // press/release
				for (let keyIndex = 0; keyIndex < this.NUM_ENCODERS; keyIndex++) {
					const keyPressed = Boolean(data[4 + keyIndex])
					const stateChanged = keyPressed !== this.#encoderState[keyIndex]
					if (stateChanged) {
						this.#encoderState[keyIndex] = keyPressed
						if (keyPressed) {
							this.emit('encoderDown', keyIndex)
						} else {
							this.emit('encoderUp', keyIndex)
						}
					}
				}
				break
			case 0x01: // rotate
				for (let keyIndex = 0; keyIndex < this.NUM_ENCODERS; keyIndex++) {
					const intArray = new Int8Array(data.buffer, data.byteOffset, data.byteLength)
					const value = intArray[4 + keyIndex]
					if (value > 0) {
						this.emit('rotateRight', keyIndex, value)
					} else if (value < 0) {
						this.emit('rotateLeft', keyIndex, -value)
					}
				}
				break
		}
	}

	public override async fillLcd(buffer: Buffer, sourceOptions: FillImageOptions): Promise<void> {
		const size = this.LCD_STRIP_SIZE
		if (!size) throw new Error(`There is no lcd to fill`)

		return this.fillLcdRegion(0, 0, buffer, {
			format: sourceOptions.format,
			width: size.width,
			height: size.height,
		})
	}

	public override async fillEncoderLcd(
		index: EncoderIndex,
		buffer: Uint8Array,
		sourceOptions: FillImageOptions
	): Promise<void> {
		if (this.NUM_ENCODERS === 0) throw new Error(`There are no encoders`)

		const size = this.LCD_ENCODER_SIZE
		const x = index * size.width

		return this.fillLcdRegion(x, 0, buffer, {
			format: sourceOptions.format,
			width: size.width,
			height: size.height,
		})
	}

	public override async fillLcdRegion(
		x: number,
		y: number,
		imageBuffer: Uint8Array,
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
		await this.device.sendReports(packets)
	}

	private async convertFillLcdBuffer(
		sourceBuffer: Uint8Array,
		sourceOptions: FillLcdImageOptions
	): Promise<Uint8Array> {
		const sourceOptions2: InternalFillImageOptions = {
			format: sourceOptions.format,
			offset: 0,
			stride: sourceOptions.width * sourceOptions.format.length,
		}

		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions2,
			{ colorMode: 'rgba', xFlip: this.xyFlip, yFlip: this.xyFlip },
			0,
			sourceOptions.width,
			sourceOptions.height
		)

		return this.encodeJPEG(byteBuffer, sourceOptions.width, sourceOptions.height)
	}
}
