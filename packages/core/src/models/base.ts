import * as EventEmitter from 'eventemitter3'

import { HIDDevice } from '../device'
import { DeviceModelId } from '../models'
import { KeyIndex } from './id'
import { FillImageOptions, FillPanelOptions, StreamDeck, StreamDeckEvents } from './types'

export type EncodeJPEGHelper = (buffer: Buffer, width: number, height: number) => Promise<Buffer>

export interface OpenStreamDeckOptions {
	useOriginalKeyOrder?: boolean
	encodeJPEG?: EncodeJPEGHelper
}

export type StreamDeckProperties = Readonly<{
	MODEL: DeviceModelId
	PRODUCT_NAME: string
	COLUMNS: number
	ROWS: number
	ICON_SIZE: number
	KEY_DIRECTION: 'ltr' | 'rtl'
	KEY_DATA_OFFSET: number
}>

export interface InternalFillImageOptions extends FillImageOptions {
	offset: number
	stride: number
}

export abstract class StreamDeckInputBase extends EventEmitter<StreamDeckEvents> implements StreamDeck {
	get NUM_KEYS(): number {
		return this.KEY_COLUMNS * this.KEY_ROWS
	}
	get KEY_COLUMNS(): number {
		return this.deviceProperties.COLUMNS
	}
	get KEY_ROWS(): number {
		return this.deviceProperties.ROWS
	}

	get ICON_SIZE(): number {
		return this.deviceProperties.ICON_SIZE
	}
	get ICON_BYTES(): number {
		return this.ICON_PIXELS * 3
	}
	get ICON_PIXELS(): number {
		return this.ICON_SIZE * this.ICON_SIZE
	}

	get MODEL(): DeviceModelId {
		return this.deviceProperties.MODEL
	}
	get PRODUCT_NAME(): string {
		return this.deviceProperties.PRODUCT_NAME
	}

	protected readonly device: HIDDevice
	protected readonly deviceProperties: Readonly<StreamDeckProperties>
	// private readonly options: Readonly<OpenStreamDeckOptions>
	private readonly keyState: boolean[]

	constructor(device: HIDDevice, _options: OpenStreamDeckOptions, properties: StreamDeckProperties) {
		super()

		this.deviceProperties = properties
		this.device = device

		this.keyState = new Array<boolean>(this.NUM_KEYS).fill(false)

		this.device.dataKeyOffset = properties.KEY_DATA_OFFSET
		this.device.on('input', (data) => {
			for (let i = 0; i < this.NUM_KEYS; i++) {
				const keyPressed = Boolean(data[i])
				const keyIndex = this.transformKeyIndex(i)
				const stateChanged = keyPressed !== this.keyState[keyIndex]
				if (stateChanged) {
					this.keyState[keyIndex] = keyPressed
					if (keyPressed) {
						this.emit('down', keyIndex)
					} else {
						this.emit('up', keyIndex)
					}
				}
			}
		})

		this.device.on('error', (err) => {
			this.emit('error', err)
		})
	}

	public checkValidKeyIndex(keyIndex: KeyIndex): void {
		if (keyIndex < 0 || keyIndex >= this.NUM_KEYS) {
			throw new TypeError(`Expected a valid keyIndex 0 - ${this.NUM_KEYS - 1}`)
		}
	}

	public async close(): Promise<void> {
		return this.device.close()
	}

	public abstract setBrightness(percentage: number): Promise<void>

	public abstract resetToLogo(): Promise<void>

	public abstract getFirmwareVersion(): Promise<string>
	public abstract getSerialNumber(): Promise<string>

	protected transformKeyIndex(keyIndex: KeyIndex): KeyIndex {
		return keyIndex
	}

	public abstract fillKeyColor(keyIndex: KeyIndex, r: number, g: number, b: number): Promise<void>
	public abstract fillKeyBuffer(keyIndex: KeyIndex, imageBuffer: Buffer, options?: FillImageOptions): Promise<void>
	public abstract fillPanelBuffer(imageBuffer: Buffer, options?: FillPanelOptions): Promise<void>

	public abstract clearKey(keyIndex: KeyIndex): Promise<void>
	public abstract clearPanel(): Promise<void>
}

export abstract class StreamDeckBase extends StreamDeckInputBase {
	public async fillKeyColor(keyIndex: KeyIndex, r: number, g: number, b: number): Promise<void> {
		this.checkValidKeyIndex(keyIndex)

		this.checkRGBValue(r)
		this.checkRGBValue(g)
		this.checkRGBValue(b)

		const pixels = Buffer.alloc(this.ICON_BYTES, Buffer.from([r, g, b]))
		const keyIndex2 = this.transformKeyIndex(keyIndex)
		await this.fillImageRange(keyIndex2, pixels, {
			format: 'rgb',
			offset: 0,
			stride: this.ICON_SIZE * 3,
		})
	}

	public async fillKeyBuffer(keyIndex: KeyIndex, imageBuffer: Buffer, options?: FillImageOptions): Promise<void> {
		this.checkValidKeyIndex(keyIndex)

		const sourceFormat = options?.format ?? 'rgb'
		this.checkSourceFormat(sourceFormat)

		const imageSize = this.ICON_PIXELS * sourceFormat.length
		if (imageBuffer.length !== imageSize) {
			throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`)
		}

		const keyIndex2 = this.transformKeyIndex(keyIndex)
		await this.fillImageRange(keyIndex2, imageBuffer, {
			format: sourceFormat,
			offset: 0,
			stride: this.ICON_SIZE * sourceFormat.length,
		})
	}

	public async fillPanelBuffer(imageBuffer: Buffer, options?: FillPanelOptions): Promise<void> {
		const sourceFormat = options?.format ?? 'rgb'
		this.checkSourceFormat(sourceFormat)

		const imageSize = this.ICON_PIXELS * sourceFormat.length * this.NUM_KEYS
		if (imageBuffer.length !== imageSize) {
			throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`)
		}

		const iconSize = this.ICON_SIZE * sourceFormat.length
		const stride = iconSize * this.KEY_COLUMNS

		const ps: Array<Promise<void>> = []
		for (let row = 0; row < this.KEY_ROWS; row++) {
			const rowOffset = stride * row * this.ICON_SIZE

			for (let column = 0; column < this.KEY_COLUMNS; column++) {
				let index = row * this.KEY_COLUMNS
				if (this.deviceProperties.KEY_DIRECTION === 'ltr') {
					index += column
				} else {
					index += this.KEY_COLUMNS - column - 1
				}

				const colOffset = column * iconSize

				ps.push(
					this.fillImageRange(index, imageBuffer, {
						format: sourceFormat,
						offset: rowOffset + colOffset,
						stride,
					})
				)
			}
		}
		await Promise.all(ps)
	}

	public async clearKey(keyIndex: KeyIndex): Promise<void> {
		this.checkValidKeyIndex(keyIndex)

		const pixels = Buffer.alloc(this.ICON_BYTES, 0)
		const keyIndex2 = this.transformKeyIndex(keyIndex)
		await this.fillImageRange(keyIndex2, pixels, {
			format: 'rgb',
			offset: 0,
			stride: this.ICON_SIZE * 3,
		})
	}

	public async clearPanel(): Promise<void> {
		const pixels = Buffer.alloc(this.ICON_BYTES, 0)
		const ps: Array<Promise<void>> = []
		for (let keyIndex = 0; keyIndex < this.NUM_KEYS; keyIndex++) {
			ps.push(
				this.fillImageRange(keyIndex, pixels, {
					format: 'rgb',
					offset: 0,
					stride: this.ICON_SIZE * 3,
				})
			)
		}
		await Promise.all(ps)
	}

	protected abstract convertFillImage(imageBuffer: Buffer, sourceOptions: InternalFillImageOptions): Promise<Buffer>

	protected getFillImageCommandHeaderLength(): number {
		return 16
	}

	protected writeFillImageCommandHeader(
		buffer: Buffer,
		keyIndex: number,
		partIndex: number,
		isLast: boolean,
		_bodyLength: number
	): void {
		buffer.writeUInt8(0x02, 0)
		buffer.writeUInt8(0x01, 1)
		buffer.writeUInt16LE(partIndex, 2)
		// 3 = 0x00
		buffer.writeUInt8(isLast ? 1 : 0, 4)
		buffer.writeUInt8(keyIndex + 1, 5)
	}

	protected abstract getFillImagePacketLength(): number

	protected generateFillImageWrites(keyIndex: KeyIndex, byteBuffer: Buffer): Buffer[] {
		const MAX_PACKET_SIZE = this.getFillImagePacketLength()
		const PACKET_HEADER_LENGTH = this.getFillImageCommandHeaderLength()
		const MAX_PAYLOAD_SIZE = MAX_PACKET_SIZE - PACKET_HEADER_LENGTH

		const result: Buffer[] = []

		let remainingBytes = byteBuffer.length
		for (let part = 0; remainingBytes > 0; part++) {
			const packet = Buffer.alloc(MAX_PACKET_SIZE)

			const byteCount = Math.min(remainingBytes, MAX_PAYLOAD_SIZE)
			this.writeFillImageCommandHeader(packet, keyIndex, part, remainingBytes <= MAX_PAYLOAD_SIZE, byteCount)

			const byteOffset = byteBuffer.length - remainingBytes
			remainingBytes -= byteCount
			byteBuffer.copy(packet, PACKET_HEADER_LENGTH, byteOffset, byteOffset + byteCount)

			result.push(packet)
		}

		return result
	}

	private async fillImageRange(keyIndex: KeyIndex, imageBuffer: Buffer, sourceOptions: InternalFillImageOptions) {
		this.checkValidKeyIndex(keyIndex)

		const byteBuffer = await this.convertFillImage(imageBuffer, sourceOptions)

		const packets = this.generateFillImageWrites(keyIndex, byteBuffer)
		await this.device.sendReports(packets)
	}

	private checkRGBValue(value: number): void {
		if (value < 0 || value > 255) {
			throw new TypeError('Expected a valid color RGB value 0 - 255')
		}
	}

	private checkSourceFormat(format: 'rgb' | 'rgba' | 'bgr' | 'bgra'): void {
		switch (format) {
			case 'rgb':
			case 'rgba':
			case 'bgr':
			case 'bgra':
				break
			default: {
				const fmt: never = format
				throw new TypeError(`Expected a known color format not "${fmt as string}"`)
			}
		}
	}
}
