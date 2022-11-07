import { imageToByteArray } from '../util'
import { FillImageOptions, FillLcdImageOptions, LcdSegmentSize } from './types'
import { HIDDevice } from '../device'
import { InternalFillImageOptions, OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId } from './id'
import { EncoderIndex } from '.'

const plusProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.PLUS,
	PRODUCT_NAME: 'Streamdeck +',
	COLUMNS: 4,
	ROWS: 2,
	ICON_SIZE: 120,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 3,
}

export class StreamDeckPlus extends StreamDeckGen2Base {
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

	protected handleInputBuffer(data: Uint8Array): void {
		const inputType = data[0]
		switch (inputType) {
			case 0x00: // Button
				super.handleInputBuffer(data)
				break
			case 0x02: // LCD
				console.log(data)
				// TODO
				break
			case 0x03: // Encoder
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
							switch (data[4 + keyIndex]) {
								case 0x01: // Right
									this.emit('rotateRight', keyIndex)
									break
								case 0xff: // Left
									this.emit('rotateLeft', keyIndex)
									break
							}
						}
						break
				}
				// TODO
				break
		}
	}

	public override async fillEncoderLcd(
		index: EncoderIndex,
		buffer: Buffer,
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

		const packets = this.generateFillLcdWrites(x, y, byteBuffer, sourceOptions)
		await this.device.sendReports(packets)
	}

	private async convertFillLcdBuffer(sourceBuffer: Buffer, sourceOptions: FillLcdImageOptions): Promise<Buffer> {
		const sourceOptions2: InternalFillImageOptions = {
			format: sourceOptions.format,
			offset: 0,
			stride: sourceOptions.width * sourceOptions.format.length,
		}

		const byteBuffer = imageToByteArray(
			sourceBuffer,
			sourceOptions2,
			{ colorMode: 'rgba', xFlip: this.xyFlip, yFlip: this.xyFlip },
			0,
			sourceOptions.width,
			sourceOptions.height
		)

		return this.encodeJPEG(byteBuffer, sourceOptions.width, sourceOptions.height)
	}

	private generateFillLcdWrites(
		x: number,
		y: number,
		byteBuffer: Buffer,
		sourceOptions: FillLcdImageOptions
	): Buffer[] {
		const MAX_PACKET_SIZE = 1024 // this.getFillImagePacketLength()
		const PACKET_HEADER_LENGTH = 16
		const MAX_PAYLOAD_SIZE = MAX_PACKET_SIZE - PACKET_HEADER_LENGTH

		const result: Buffer[] = []

		let remainingBytes = byteBuffer.length
		for (let part = 0; remainingBytes > 0; part++) {
			const packet = Buffer.alloc(MAX_PACKET_SIZE)

			const byteCount = Math.min(remainingBytes, MAX_PAYLOAD_SIZE)
			packet.writeUInt8(0x02, 0)
			packet.writeUInt8(0x0c, 1)
			packet.writeUInt16LE(x, 2)
			packet.writeUInt16LE(y, 4)
			packet.writeUInt16LE(sourceOptions.width, 6)
			packet.writeUInt16LE(sourceOptions.height, 8)
			packet.writeUInt8(remainingBytes <= MAX_PAYLOAD_SIZE ? 1 : 0, 10) // Is last
			packet.writeUInt16LE(part, 11)
			packet.writeUInt16LE(byteCount, 13)

			const byteOffset = byteBuffer.length - remainingBytes
			remainingBytes -= byteCount
			byteBuffer.copy(packet, PACKET_HEADER_LENGTH, byteOffset, byteOffset + byteCount)

			result.push(packet)
		}

		return result
	}
}
