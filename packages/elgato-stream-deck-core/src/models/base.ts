import { EventEmitter } from 'events'

import { HIDDevice } from '../device'
import { DeviceModelId } from '../models'
import { bufferToIntArray, numberArrayToString } from '../util'
import { KeyIndex } from './id'

export interface OpenStreamDeckOptions {
	useOriginalKeyOrder?: boolean
}

export interface StreamDeckProperties {
	MODEL: DeviceModelId
	COLUMNS: number
	ROWS: number
	ICON_SIZE: number
	KEY_DIRECTION: 'ltr' | 'rtl'
}

export interface StreamDeck {
	readonly NUM_KEYS: number
	readonly KEY_COLUMNS: number
	readonly KEY_ROWS: number

	readonly ICON_SIZE: number
	readonly ICON_BYTES: number

	readonly MODEL: DeviceModelId

	/**
	 * Fills the given key with a solid color.
	 *
	 * @param {number} keyIndex The key to fill
	 * @param {number} r The color's red value. 0 - 255
	 * @param {number} g The color's green value. 0 - 255
	 * @param {number} b The color's blue value. 0 -255
	 */
	fillColor(keyIndex: KeyIndex, r: number, g: number, b: number): void

	/**
	 * Fills the given key with an image in a Buffer.
	 *
	 * @param {number} keyIndex The key to fill
	 * @param {Buffer} imageBuffer
	 */
	fillImage(keyIndex: KeyIndex, imageBuffer: Buffer): void

	/**
	 * Fills the whole panel with an image in a Buffer.
	 *
	 * @param {Buffer} imageBuffer
	 */
	fillPanel(imageBuffer: Buffer): void

	/**
	 * Clears the given key.
	 *
	 * @param {number} keyIndex The key to clear
	 */
	clearKey(keyIndex: KeyIndex): void

	/**
	 * Clears all keys.
	 */
	clearAllKeys(): void

	/**
	 * Sets the brightness of the keys on the Stream Deck
	 *
	 * @param {number} percentage The percentage brightness
	 */
	setBrightness(percentage: number): void

	/**
	 * Resets the display to the startup logo
	 */
	resetToLogo(): void

	/**
	 * Get firmware version from Stream Deck
	 */
	getFirmwareVersion(): Promise<string>

	/**
	 * Get serial number from Stream Deck
	 */
	getSerialNumber(): Promise<string>

	on(event: 'down' | 'up', listener: (keyIndex: KeyIndex) => void): any
	on(event: 'error', listener: (e: any) => void): any
}

export abstract class StreamDeckBase extends EventEmitter implements StreamDeck {
	get NUM_KEYS() {
		return this.KEY_COLUMNS * this.KEY_ROWS
	}
	get KEY_COLUMNS() {
		return this.deviceProperties.COLUMNS
	}
	get KEY_ROWS() {
		return this.deviceProperties.ROWS
	}

	get ICON_SIZE() {
		return this.deviceProperties.ICON_SIZE
	}
	get ICON_BYTES() {
		return this.ICON_SIZE * this.ICON_SIZE * 3
	}

	get MODEL() {
		return this.deviceProperties.MODEL
	}

	protected device: HIDDevice
	private deviceProperties: StreamDeckProperties
	private keyState: boolean[]

	constructor(device: HIDDevice, properties: StreamDeckProperties, dataKeyOffset: number) {
		super()

		this.deviceProperties = properties
		this.device = device

		this.keyState = new Array(this.NUM_KEYS).fill(false)

		this.device.on('data', data => {
			// The first byte is a report ID, the last byte appears to be padding.
			// We strip these out for now.
			data = data.slice(dataKeyOffset, data.length - 1)

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

		this.device.on('error', err => {
			this.emit('error', err)
		})
	}

	public fillColor(keyIndex: KeyIndex, r: number, g: number, b: number) {
		this.checkValidKeyIndex(keyIndex)

		this.checkRGBValue(r)
		this.checkRGBValue(g)
		this.checkRGBValue(b)

		const pixels = Buffer.alloc(this.ICON_BYTES, Buffer.from([r, g, b]))
		const keyIndex2 = this.transformKeyIndex(keyIndex)
		this.fillImageRange(keyIndex2, pixels, 0, this.ICON_SIZE * 3)
	}

	public fillImage(keyIndex: KeyIndex, imageBuffer: Buffer) {
		this.checkValidKeyIndex(keyIndex)

		if (imageBuffer.length !== this.ICON_BYTES) {
			throw new RangeError(`Expected image buffer of length ${this.ICON_BYTES}, got length ${imageBuffer.length}`)
		}

		const keyIndex2 = this.transformKeyIndex(keyIndex)
		this.fillImageRange(keyIndex2, imageBuffer, 0, this.ICON_SIZE * 3)
	}

	public fillPanel(imageBuffer: Buffer) {
		if (imageBuffer.length !== this.ICON_BYTES * this.NUM_KEYS) {
			throw new RangeError(
				`Expected image buffer of length ${this.ICON_BYTES * this.NUM_KEYS}, got length ${imageBuffer.length}`
			)
		}

		for (let row = 0; row < this.KEY_ROWS; row++) {
			for (let column = 0; column < this.KEY_COLUMNS; column++) {
				let index = row * this.KEY_COLUMNS
				if (this.deviceProperties.KEY_DIRECTION === 'ltr') {
					index += column
				} else {
					index += this.KEY_COLUMNS - column - 1
				}

				const stride = this.ICON_SIZE * 3 * this.KEY_COLUMNS
				const rowOffset = stride * row * this.ICON_SIZE
				const colOffset = column * this.ICON_SIZE * 3

				this.fillImageRange(index, imageBuffer, rowOffset + colOffset, stride)
			}
		}
	}

	public clearKey(keyIndex: KeyIndex) {
		this.checkValidKeyIndex(keyIndex)
		return this.fillColor(keyIndex, 0, 0, 0)
	}

	public clearAllKeys() {
		// TODO - this could be restructured to be more efficient (by reusing the final colour buffer)
		for (let keyIndex = 0; keyIndex < this.NUM_KEYS; keyIndex++) {
			this.clearKey(keyIndex)
		}
	}

	public setBrightness(percentage: number) {
		if (percentage < 0 || percentage > 100) {
			throw new RangeError('Expected brightness percentage to be between 0 and 100')
		}

		// prettier-ignore
		const brightnessCommandBuffer = [
			0x05,
			0x55, 0xaa, 0xd1, 0x01, percentage, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		]
		this.device.sendFeatureReport(brightnessCommandBuffer)
	}

	public resetToLogo() {
		// prettier-ignore
		const resetCommandBuffer = [
			0x0b,
			0x63, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		]
		this.device.sendFeatureReport(resetCommandBuffer)
	}

	public getFirmwareVersion() {
		return this.device.getFeatureReport(4, 17).then(val => numberArrayToString(val.slice(5)))
	}

	public getSerialNumber() {
		return this.device.getFeatureReport(3, 17).then(val => numberArrayToString(val.slice(5)))
	}

	protected abstract transformKeyIndex(keyIndex: KeyIndex): KeyIndex

	protected abstract convertFillImage(imageBuffer: Buffer, sourceOffset: number, sourceStride: number): Buffer

	protected getFillImageCommandHeaderLength() {
		return 16
	}

	protected writeFillImageCommandHeader(
		buffer: Buffer,
		keyIndex: number,
		partIndex: number,
		isLast: boolean,
		_bodyLength: number
	) {
		buffer.writeUInt8(0x02, 0)
		buffer.writeUInt8(0x01, 1)
		buffer.writeUInt16LE(partIndex, 2)
		// 3 = 0x00
		buffer.writeUInt8(isLast ? 1 : 0, 4)
		buffer.writeUInt8(keyIndex + 1, 5)
	}

	protected abstract getFillImagePacketLength(): number

	protected generateFillImageWrites(keyIndex: KeyIndex, byteBuffer: Buffer): number[][] {
		const MAX_PACKET_SIZE = this.getFillImagePacketLength()
		const PACKET_HEADER_LENGTH = this.getFillImageCommandHeaderLength()
		const MAX_PAYLOAD_SIZE = MAX_PACKET_SIZE - PACKET_HEADER_LENGTH

		const result: number[][] = []

		let remainingBytes = byteBuffer.length
		for (let part = 0; remainingBytes > 0; part++) {
			const packet = Buffer.alloc(MAX_PACKET_SIZE)

			const byteCount = Math.min(remainingBytes, MAX_PAYLOAD_SIZE)
			this.writeFillImageCommandHeader(packet, keyIndex, part, remainingBytes <= MAX_PAYLOAD_SIZE, byteCount)

			const byteOffset = byteBuffer.length - remainingBytes
			remainingBytes -= byteCount
			byteBuffer.copy(packet, PACKET_HEADER_LENGTH, byteOffset, byteOffset + byteCount)

			result.push(bufferToIntArray(packet))
		}

		return result
	}

	private fillImageRange(keyIndex: KeyIndex, imageBuffer: Buffer, sourceOffset: number, sourceStride: number) {
		this.checkValidKeyIndex(keyIndex)

		const byteBuffer = this.convertFillImage(imageBuffer, sourceOffset, sourceStride)

		const packets = this.generateFillImageWrites(keyIndex, byteBuffer)
		for (const packet of packets) {
			this.device.sendReport(packet)
		}
	}

	private checkValidKeyIndex(keyIndex: KeyIndex) {
		if (keyIndex < 0 || keyIndex >= this.NUM_KEYS) {
			throw new TypeError(`Expected a valid keyIndex 0 - ${this.NUM_KEYS - 1}`)
		}
	}

	private checkRGBValue(value: number) {
		if (value < 0 || value > 255) {
			throw new TypeError('Expected a valid color RGB value 0 - 255')
		}
	}
}
