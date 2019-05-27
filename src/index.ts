import { EventEmitter } from 'events'
import { HID, devices as HIDdevices } from 'node-hid'
import { DeviceModel, DeviceModels } from './models'

export type KeyIndex = number

class StreamDeck extends EventEmitter {
	/**
	 * Checks a value is a valid RGB value. A number between 0 and 255.
	 *
	 * @static
	 * @param {number} value The number to check
	 */
	static checkRGBValue (value: number) {
		if (value < 0 || value > 255) {
			throw new TypeError('Expected a valid color RGB value 0 - 255')
		}
	}

	/**
	 * Checks a keyIndex is a valid key for a stream deck. A number between 0 and 14.
	 *
	 * @static
	 * @param {number} keyIndex The keyIndex to check
	 */
	checkValidKeyIndex (keyIndex: KeyIndex) {
		if (keyIndex < 0 || keyIndex >= this.NUM_KEYS) {
			throw new TypeError(`Expected a valid keyIndex 0 - ${this.NUM_KEYS - 1}`)
		}
	}

	private device: HID
	private deviceModel: DeviceModel
	private keyState: boolean[]

	get NUM_KEYS () {
		return this.KEY_COLUMNS * this.KEY_ROWS
	}
	get KEY_COLUMNS () {
		return this.deviceModel.KeyCols
	}
	get KEY_ROWS () {
		return this.deviceModel.KeyRows
	}

	/**
	 * The pixel size of an icon written to the Stream Deck key.
	 *
	 * @readonly
	 */
	get ICON_SIZE () {
		return this.deviceModel.ImageSize
	}
	get ICON_BYTES () {
		return this.ICON_SIZE * this.ICON_SIZE * 3
	}
	private get PADDED_ICON_SIZE () {
		return this.ICON_SIZE + this.deviceModel.ImageBorder * 2
	}
	private get PADDED_ICON_BYTES () {
		return this.PADDED_ICON_SIZE * this.PADDED_ICON_SIZE * 3
	}

	constructor (devicePath?: string) {
		super()

		const productIds = DeviceModels.map(m => m.ProductId)
		const foundDevices = HIDdevices().filter(device => {
			if (devicePath && device.path !== devicePath) {
				return false
			}
			return device.vendorId === 0x0fd9 && productIds.indexOf(device.productId) !== -1
		})

		if (foundDevices.length === 0) {
			if (devicePath) {
				throw new Error(`Device "${devicePath}" was not found`)
			} else {
				throw new Error('No Stream Decks are connected.')
			}
		}

		if (!foundDevices[0].path) {
			throw new Error('Cannot open device. Path is missing')
		}

		this.deviceModel = DeviceModels.find(m => m.ProductId === foundDevices[0].productId) as DeviceModel
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
	 * Fills the given key with a solid color.
	 *
	 * @param {number} keyIndex The key to fill 0 - 14
	 * @param {number} r The color's red value. 0 - 255
	 * @param {number} g The color's green value. 0 - 255
	 * @param {number} b The color's blue value. 0 -255
	 */
	fillColor (keyIndex: KeyIndex, r: number, g: number, b: number) {
		this.checkValidKeyIndex(keyIndex)

		StreamDeck.checkRGBValue(r)
		StreamDeck.checkRGBValue(g)
		StreamDeck.checkRGBValue(b)

		const pixels = Buffer.alloc(this.PADDED_ICON_BYTES, Buffer.from([b, g, r]))
		this.fillImageRange(keyIndex, pixels, 0, this.ICON_SIZE * 3)
	}

	/**
	 * Fills the given key with an image in a Buffer.
	 *
	 * @param {number} keyIndex The key to fill 0 - 14
	 * @param {Buffer} imageBuffer
	 */
	fillImage (keyIndex: KeyIndex, imageBuffer: Buffer) {
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
	fillPanel (imageBuffer: Buffer) {
		if (imageBuffer.length !== this.ICON_BYTES * this.NUM_KEYS) {
			throw new RangeError(`Expected image buffer of length ${this.ICON_BYTES * this.NUM_KEYS}, got length ${imageBuffer.length}`)
		}

		for (let row = 0; row < this.KEY_ROWS; row++) {
			for (let column = 0; column < this.KEY_COLUMNS; column++) {
				const index = (row * this.KEY_COLUMNS) + this.KEY_COLUMNS - column - 1

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
	clearKey (keyIndex: KeyIndex) {
		this.checkValidKeyIndex(keyIndex)
		return this.fillColor(keyIndex, 0, 0, 0)
	}

	/**
	 * Clears all keys.
	 */
	clearAllKeys () {
		for (let keyIndex = 0; keyIndex < this.NUM_KEYS; keyIndex++) {
			this.clearKey(keyIndex)
		}
	}

	/**
	 * Sets the brightness of the keys on the Stream Deck
	 *
	 * @param {number} percentage The percentage brightness
	 */
	setBrightness (percentage: number) {
		if (percentage < 0 || percentage > 100) {
			throw new RangeError('Expected brightness percentage to be between 0 and 100')
		}

		const brightnessCommandBuffer = [0x05, 0x55, 0xaa, 0xd1, 0x01, percentage]
		this.device.sendFeatureReport(StreamDeck.padArrayToLength(brightnessCommandBuffer, 17))
	}

	/**
	 * Resets the display to the startup logo
	 */
	resetToLogo () {
		const resetCommandBuffer = [0x0B, 0x63]
		this.device.sendFeatureReport(StreamDeck.padArrayToLength(resetCommandBuffer, 17))
	}

	/**
	 * Get firmware version from Stream Deck
	 */
	getFirmwareVersion () {
		return this.device.getFeatureReport(4, 17).slice(5).map((val) => String.fromCharCode(val)).join('')
	}

	/**
	 * Get serial number from Stream Deck
	 */
	getSerialNumber () {
		return this.device.getFeatureReport(3, 17).slice(5).map((val) => String.fromCharCode(val)).join('')
	}

	private fillImageRange (keyIndex: KeyIndex, imageBuffer: Buffer, offset: number, stride: number) {
		this.checkValidKeyIndex(keyIndex)

		let pixels: number[] = []
		for (let i = 0; i < this.deviceModel.ImageBorder; i++) {
			pixels.push(...new Array(this.PADDED_ICON_SIZE * 3).fill(0))
		}

		for (let r = 0; r < this.ICON_SIZE; r++) {
			const row: number[] = new Array(this.deviceModel.ImageBorder * 3).fill(0)
			const start = r * stride + offset
			for (let i = start; i < start + (this.ICON_SIZE * 3); i += 3) {
				// TODO - the mini code does something different with coordinates. what?
				const r = imageBuffer.readUInt8(i)
				const g = imageBuffer.readUInt8(i + 1)
				const b = imageBuffer.readUInt8(i + 2)
				row.push(r, g, b)
			}
			row.push(...new Array(this.deviceModel.ImageBorder * 3).fill(0))
			pixels = pixels.concat(row.reverse())
		}

		for (let i = 0; i < this.deviceModel.ImageBorder; i++) {
			pixels.push(...new Array(this.PADDED_ICON_SIZE * 3).fill(0))
		}

		// Send the packets
		if (this.deviceModel.HalfImagePerPacket) {
			const bmpHeader = this.buildBMPHeader()
			const bytesCount = this.PADDED_ICON_BYTES + bmpHeader.length
			const frame1Bytes = (bytesCount / 2) - bmpHeader.length

			this.device.write(StreamDeck.padArrayToLength([
				...this.buildFillImageCommandHeader(keyIndex, 0x01, false),
				...bmpHeader,
				...pixels.slice(0, frame1Bytes)
			], this.deviceModel.MaxPacketSize))

			this.device.write(StreamDeck.padArrayToLength([
				...this.buildFillImageCommandHeader(keyIndex, 0x02, true),
				...pixels.slice(frame1Bytes)
			], this.deviceModel.MaxPacketSize))

		} else {
			let byteOffset = 0
			const firstPart = 0
			for (let part = firstPart; byteOffset < this.PADDED_ICON_BYTES; part++) {
				let header = this.buildFillImageCommandHeader(keyIndex, part, false) // isLast gets set later if needed
				if (part === firstPart) {
					header.push(...this.buildBMPHeader())
				}

				const byteCount = this.deviceModel.MaxPacketSize - header.length
				const payload = pixels.slice(byteOffset, byteOffset + byteCount)
				byteOffset += byteCount

				if (payload.length !== byteCount) {
					// Reached the end of the payload
					header = this.buildFillImageCommandHeader(keyIndex, part, true)
				}

				this.device.write(StreamDeck.padArrayToLength([...header, ...payload], this.deviceModel.MaxPacketSize))
			}
		}
	}

	private buildBMPHeader (): number[] {
		// Uses header format BITMAPINFOHEADER https://en.wikipedia.org/wiki/BMP_file_format

		let buf = Buffer.alloc(54)

		// Bitmap file header
		buf.write('BM')
		buf.writeUInt32LE(this.PADDED_ICON_BYTES, 2)
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

		return this.bufferToIntArray(buf)
	}

	bufferToIntArray (buffer: Buffer) {
		const array: number[] = []
		for (const pair of buffer.entries()) {
			array.push(pair[1])
		}
		return array
	}

	private buildFillImageCommandHeader (keyIndex: number, partIndex: number, isLast: boolean) {
		return [
			0x02, 0x01, partIndex, 0x00, isLast ? 0x01 : 0x00, keyIndex + 1, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		]
	}

	private static padArrayToLength (buffer: number[], targetLength: number) {
		if (targetLength > buffer.length) {
			const pad = new Array(targetLength - buffer.length).fill(0)
			return [...buffer, ...pad]
		} else {
			return buffer
		}
	}
}

module.exports = StreamDeck
