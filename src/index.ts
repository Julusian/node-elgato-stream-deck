import { EventEmitter } from 'events'
import { devices as HIDdevices, HID } from 'node-hid'

import { DEVICE_MODELS, DeviceModel, DeviceModelId } from './models'

export type KeyIndex = number

export interface StreamDeckDeviceInfo {
	model: DeviceModelId
	path: string
	serialNumber?: string
}

export class StreamDeck extends EventEmitter {
	get NUM_KEYS() {
		return this.KEY_COLUMNS * this.KEY_ROWS
	}
	get KEY_COLUMNS() {
		return this.deviceModel.KeyCols
	}
	get KEY_ROWS() {
		return this.deviceModel.KeyRows
	}

	/**
	 * The pixel size of an icon written to the Stream Deck key.
	 *
	 * @readonly
	 */
	get ICON_SIZE() {
		return this.deviceModel.ImageSize
	}
	get ICON_BYTES() {
		return this.ICON_SIZE * this.ICON_SIZE * 3
	}
	private get PADDED_ICON_SIZE() {
		return this.ICON_SIZE + this.deviceModel.ImageBorder * 2
	}
	private get PADDED_ICON_BYTES() {
		return this.PADDED_ICON_SIZE * this.PADDED_ICON_SIZE * 3
	}

	get MODEL() {
		return this.deviceModel.ModelId
	}
	/**
	 * List detected devices
	 */
	public static listDevices(): StreamDeckDeviceInfo[] {
		const devices: StreamDeckDeviceInfo[] = []
		for (const dev of HIDdevices()) {
			const model = DEVICE_MODELS.find(m => m.ProductId === dev.productId)

			if (model && dev.vendorId === 0x0fd9 && dev.path) {
				devices.push({
					model: model.ModelId,
					path: dev.path,
					serialNumber: dev.serialNumber
				})
			}
		}
		return devices
	}

	/**
	 * Get the info of a device if the given path is a streamdeck
	 */
	public static getDeviceInfo(path: string): StreamDeckDeviceInfo | undefined {
		return this.listDevices().find(dev => dev.path === path)
	}

	/**
	 * Checks a value is a valid RGB value. A number between 0 and 255.
	 *
	 * @static
	 * @param {number} value The number to check
	 */
	public static checkRGBValue(value: number) {
		if (value < 0 || value > 255) {
			throw new TypeError('Expected a valid color RGB value 0 - 255')
		}
	}

	private device: HID
	private deviceModel: DeviceModel
	private keyState: boolean[]

	constructor(devicePath?: string) {
		super()

		let foundDevices = StreamDeck.listDevices()
		if (devicePath) {
			foundDevices = foundDevices.filter(d => d.path === devicePath)
		}

		if (foundDevices.length === 0) {
			if (devicePath) {
				throw new Error(`Device "${devicePath}" was not found`)
			} else {
				throw new Error('No Stream Decks are connected.')
			}
		}

		this.deviceModel = DEVICE_MODELS.find(m => m.ModelId === foundDevices[0].model) as DeviceModel
		this.device = new HID(foundDevices[0].path)

		this.keyState = new Array(this.NUM_KEYS).fill(false)

		this.device.on('data', data => {
			// The first byte is a report ID, the last byte appears to be padding.
			// We strip these out for now.
			data = data.slice(1, data.length - 1)

			for (let i = 0; i < this.NUM_KEYS; i++) {
				const keyPressed = Boolean(data[i])
				const stateChanged = keyPressed !== this.keyState[i]
				if (stateChanged) {
					this.keyState[i] = keyPressed
					if (keyPressed) {
						this.emit('down', i)
					} else {
						this.emit('up', i)
					}
				}
			}
		})

		this.device.on('error', err => {
			this.emit('error', err)
		})
	}

	/**
	 * Checks a keyIndex is a valid key for a stream deck. A number between 0 and 14.
	 *
	 * @static
	 * @param {number} keyIndex The keyIndex to check
	 */
	public checkValidKeyIndex(keyIndex: KeyIndex) {
		if (keyIndex < 0 || keyIndex >= this.NUM_KEYS) {
			throw new TypeError(`Expected a valid keyIndex 0 - ${this.NUM_KEYS - 1}`)
		}
	}

	/**
	 * Fills the given key with a solid color.
	 *
	 * @param {number} keyIndex The key to fill 0 - 14
	 * @param {number} r The color's red value. 0 - 255
	 * @param {number} g The color's green value. 0 - 255
	 * @param {number} b The color's blue value. 0 -255
	 */
	public fillColor(keyIndex: KeyIndex, r: number, g: number, b: number) {
		this.checkValidKeyIndex(keyIndex)

		StreamDeck.checkRGBValue(r)
		StreamDeck.checkRGBValue(g)
		StreamDeck.checkRGBValue(b)

		const pixels = Buffer.alloc(this.PADDED_ICON_BYTES, Buffer.from([r, g, b]))
		this.fillImageRange(keyIndex, pixels, 0, this.ICON_SIZE * 3)
	}

	/**
	 * Fills the given key with an image in a Buffer.
	 *
	 * @param {number} keyIndex The key to fill 0 - 14
	 * @param {Buffer} imageBuffer
	 */
	public fillImage(keyIndex: KeyIndex, imageBuffer: Buffer) {
		this.checkValidKeyIndex(keyIndex)

		if (imageBuffer.length !== this.ICON_BYTES) {
			throw new RangeError(`Expected image buffer of length ${this.ICON_BYTES}, got length ${imageBuffer.length}`)
		}

		this.fillImageRange(keyIndex, imageBuffer, 0, this.ICON_SIZE * 3)
	}

	/**
	 * Fills the whole panel with an image in a Buffer.
	 *
	 * @param {Buffer} imageBuffer
	 */
	public fillPanel(imageBuffer: Buffer) {
		if (imageBuffer.length !== this.ICON_BYTES * this.NUM_KEYS) {
			throw new RangeError(
				`Expected image buffer of length ${this.ICON_BYTES * this.NUM_KEYS}, got length ${imageBuffer.length}`
			)
		}

		for (let row = 0; row < this.KEY_ROWS; row++) {
			for (let column = 0; column < this.KEY_COLUMNS; column++) {
				const index = row * this.KEY_COLUMNS + this.KEY_COLUMNS - column - 1

				const stride = this.ICON_SIZE * 3 * this.KEY_COLUMNS
				const rowOffset = stride * row * this.ICON_SIZE
				const colOffset = column * this.ICON_SIZE * 3

				this.fillImageRange(index, imageBuffer, rowOffset + colOffset, stride)
			}
		}
	}

	/**
	 * Clears the given key.
	 *
	 * @param {number} keyIndex The key to clear 0 - 14
	 */
	public clearKey(keyIndex: KeyIndex) {
		this.checkValidKeyIndex(keyIndex)
		return this.fillColor(keyIndex, 0, 0, 0)
	}

	/**
	 * Clears all keys.
	 */
	public clearAllKeys() {
		for (let keyIndex = 0; keyIndex < this.NUM_KEYS; keyIndex++) {
			this.clearKey(keyIndex)
		}
	}

	/**
	 * Sets the brightness of the keys on the Stream Deck
	 *
	 * @param {number} percentage The percentage brightness
	 */
	public setBrightness(percentage: number) {
		if (percentage < 0 || percentage > 100) {
			throw new RangeError('Expected brightness percentage to be between 0 and 100')
		}

		// prettier-ignore
		const brightnessCommandBuffer = [
			0x05, 0x55, 0xaa, 0xd1, 0x01, percentage, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00
		]
		this.device.sendFeatureReport(brightnessCommandBuffer)
	}

	/**
	 * Resets the display to the startup logo
	 */
	public resetToLogo() {
		// prettier-ignore
		const resetCommandBuffer = [
			0x0B, 0x63, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00
		]
		this.device.sendFeatureReport(resetCommandBuffer)
	}

	/**
	 * Get firmware version from Stream Deck
	 */
	public getFirmwareVersion() {
		return this.device
			.getFeatureReport(4, 17)
			.slice(5)
			.map(val => String.fromCharCode(val))
			.join('')
	}

	/**
	 * Get serial number from Stream Deck
	 */
	public getSerialNumber() {
		return this.device
			.getFeatureReport(3, 17)
			.slice(5)
			.map(val => String.fromCharCode(val))
			.join('')
	}

	private fillImageRange(keyIndex: KeyIndex, imageBuffer: Buffer, offset: number, stride: number) {
		this.checkValidKeyIndex(keyIndex)

		const byteBuffer = Buffer.alloc(this.PADDED_ICON_BYTES)

		const rowBytes = this.PADDED_ICON_SIZE * 3
		for (let r = 0; r < this.ICON_SIZE; r++) {
			const row: number[] = []
			const start = r * stride + offset
			for (let i = start; i < start + this.ICON_SIZE * 3; i += 3) {
				// TODO - the mini code does something different with coordinates. what?
				const red = imageBuffer.readUInt8(i)
				const green = imageBuffer.readUInt8(i + 1)
				const blue = imageBuffer.readUInt8(i + 2)
				row.push(red, green, blue)
			}
			row.push(...new Array(this.deviceModel.ImageBorder * 3).fill(0))
			byteBuffer.set(row.reverse(), rowBytes * r + this.deviceModel.ImageBorder * 2 * 3)
		}

		if (this.deviceModel.ModelId === DeviceModelId.ORIGINAL) {
			// The original uses larger packets, and splits the payload equally across 2

			const bmpHeader = this.buildBMPHeader()
			const bytesCount = this.PADDED_ICON_BYTES + bmpHeader.length
			const frame1Bytes = bytesCount / 2 - bmpHeader.length

			const packet1 = Buffer.alloc(this.deviceModel.MaxPacketSize)
			const packet1Header = this.buildFillImageCommandHeader(keyIndex, 0x01, false)
			packet1.set(packet1Header, 0)
			packet1.set(bmpHeader, packet1Header.length)
			byteBuffer.copy(packet1, packet1Header.length + bmpHeader.length, 0, frame1Bytes)
			this.device.write(this.bufferToIntArray(packet1))

			const packet2 = Buffer.alloc(this.deviceModel.MaxPacketSize)
			const packet2Header = this.buildFillImageCommandHeader(keyIndex, 0x02, true)
			packet2.set(packet2Header, 0)
			byteBuffer.copy(packet2, packet2Header.length, frame1Bytes)
			this.device.write(this.bufferToIntArray(packet2))
		} else {
			// Newer models use smaller packets and chunk to fill as few as possible

			let byteOffset = 0
			const firstPart = 0
			for (let part = firstPart; byteOffset < this.PADDED_ICON_BYTES; part++) {
				const packet = Buffer.alloc(this.deviceModel.MaxPacketSize)
				const header = this.buildFillImageCommandHeader(keyIndex, part, false) // isLast gets set later if needed
				packet.set(header, 0)
				let nextPosition = header.length
				if (part === firstPart) {
					const bmpHeader = this.buildBMPHeader()
					packet.set(bmpHeader, nextPosition)
					nextPosition += bmpHeader.length
				}

				const byteCount = this.deviceModel.MaxPacketSize - nextPosition
				byteBuffer.copy(packet, nextPosition, byteOffset, byteOffset + byteCount)
				byteOffset += byteCount

				if (byteOffset >= this.PADDED_ICON_BYTES) {
					// Reached the end of the payload
					packet.set(this.buildFillImageCommandHeader(keyIndex, part, true), 0)
				}

				this.device.write(this.bufferToIntArray(packet))
			}
		}
	}

	private buildFillImageCommandHeader(keyIndex: number, partIndex: number, isLast: boolean) {
		// prettier-ignore
		return [
			0x02, 0x01, partIndex, 0x00, isLast ? 0x01 : 0x00, keyIndex + 1, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		]
	}

	private buildBMPHeader(): Buffer {
		// Uses header format BITMAPINFOHEADER https://en.wikipedia.org/wiki/BMP_file_format
		const buf = Buffer.alloc(54)

		// Bitmap file header
		buf.write('BM')
		buf.writeUInt32LE(this.PADDED_ICON_BYTES + 54, 2)
		buf.writeInt16LE(0, 6)
		buf.writeInt16LE(0, 8)
		buf.writeUInt32LE(54, 10) // Full header size

		// DIB header (BITMAPINFOHEADER)
		buf.writeUInt32LE(40, 14) // DIB header size
		buf.writeInt32LE(this.PADDED_ICON_SIZE, 18)
		buf.writeInt32LE(this.PADDED_ICON_SIZE, 22)
		buf.writeInt16LE(1, 26) // Color planes
		buf.writeInt16LE(24, 28) // Bit depth
		buf.writeInt32LE(0, 30) // Compression
		buf.writeInt32LE(this.PADDED_ICON_BYTES, 34) // Image size
		buf.writeInt32LE(this.deviceModel.ImagePPM, 38) // Horizontal resolution ppm
		buf.writeInt32LE(this.deviceModel.ImagePPM, 42) // Vertical resolution ppm
		buf.writeInt32LE(0, 46) // Colour pallette size
		buf.writeInt32LE(0, 50) // 'Important' Colour count

		return buf
	}

	private bufferToIntArray(buffer: Buffer): number[] {
		const array: number[] = []
		for (const pair of buffer.entries()) {
			array.push(pair[1])
		}
		return array
	}
}

module.exports = StreamDeck
