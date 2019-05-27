import { EventEmitter } from 'events'
import { HID, devices as HIDdevices } from 'node-hid'

const PAGE_PACKET_SIZE = 8191
const NUM_FIRST_PAGE_PIXELS = 2583
const NUM_SECOND_PAGE_PIXELS = 2601
const ICON_SIZE = 72
const NUM_TOTAL_PIXELS = NUM_FIRST_PAGE_PIXELS + NUM_SECOND_PAGE_PIXELS
const BYTES_PER_ICON = ICON_SIZE * ICON_SIZE * 3 // RGB
const NUM_BUTTON_COLUMNS = 5
const NUM_BUTTON_ROWS = 3
const NUM_KEYS = NUM_BUTTON_ROWS * NUM_BUTTON_COLUMNS

export type KeyIndex = number

class StreamDeck extends EventEmitter {
	/**
	 * The pixel size of an icon written to the Stream Deck key.
	 *
	 * @readonly
	 */
	static get ICON_SIZE () {
		return ICON_SIZE
	}

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
	static checkValidKeyIndex (keyIndex: KeyIndex) {
		if (keyIndex < 0 || keyIndex > 14) {
			throw new TypeError('Expected a valid keyIndex 0 - 14')
		}
	}

	/**
	 * Pads a given buffer till padLength with 0s.
	 *
	 * @private
	 * @param {Buffer} buffer Buffer to pad
	 * @param {number} padLength The length to pad to
	 * @returns {Buffer} The Buffer padded to the length requested
	 */
	static padBufferToLength (buffer: Buffer, padLength: number) {
		return Buffer.concat([buffer, StreamDeck.createPadBuffer(padLength - buffer.length)])
	}

	/**
	 * Returns an empty buffer (filled with zeroes) of the given length
	 *
	 * @private
	 * @param {number} padLength Length of the buffer
	 * @returns {Buffer}
	 */
	static createPadBuffer (padLength: number) {
		return Buffer.alloc(padLength)
	}

	/**
	 * Converts a buffer into an number[]. Used to supply the underlying
	 * node-hid device with the format it accepts.
	 *
	 * @static
	 * @param {Buffer} buffer Buffer to convert
	 * @returns {number[]} the converted buffer
	 */
	static bufferToIntArray (buffer: Buffer): number[] {
		const array: number[] = []
		for (const pair of buffer.entries()) {
			array.push(pair[1])
		}
		return array
	}

	private device: HID
	private keyState: boolean[]

	constructor (devicePath?: string) {
		super()

		if (!devicePath) {
			// Device path not provided, will then select any connected device.
			const devices = HIDdevices()
			const connectedStreamDecks = devices.filter(device => {
				return device.vendorId === 0x0fd9 && device.productId === 0x0060
			})
			if (!connectedStreamDecks[0]) {
				throw new Error('No Stream Decks are connected.')
			}
			if (!connectedStreamDecks[0].path) {
				throw new Error('Found device is missing path')
			}
			this.device = new HID(connectedStreamDecks[0].path)
		} else {
			this.device = new HID(devicePath)
		}

		this.keyState = new Array(NUM_KEYS).fill(false)

		this.device.on('data', data => {
			// The first byte is a report ID, the last byte appears to be padding.
			// We strip these out for now.
			data = data.slice(1, data.length - 1)

			for (let i = 0; i < NUM_KEYS; i++) {
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
	 * Writes a Buffer to the Stream Deck.
	 *
	 * @param {Buffer} buffer The buffer written to the Stream Deck
	 * @returns undefined
	 */
	write (buffer: Buffer) {
		return this.device.write(StreamDeck.bufferToIntArray(buffer))
	}

	/**
	 * Sends a HID feature report to the Stream Deck.
	 *
	 * @param {Buffer} buffer The buffer send to the Stream Deck.
	 */
	sendFeatureReport (buffer: Buffer) {
		return this.device.sendFeatureReport(StreamDeck.bufferToIntArray(buffer))
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
		StreamDeck.checkValidKeyIndex(keyIndex)

		StreamDeck.checkRGBValue(r)
		StreamDeck.checkRGBValue(g)
		StreamDeck.checkRGBValue(b)

		const pixel = Buffer.from([b, g, r])
		this._writePage1(keyIndex, Buffer.alloc(NUM_FIRST_PAGE_PIXELS * 3, pixel))
		this._writePage2(keyIndex, Buffer.alloc(NUM_SECOND_PAGE_PIXELS * 3, pixel))
	}

	/**
	 * Fills the given key with an image in a Buffer.
	 *
	 * @param {number} keyIndex The key to fill 0 - 14
	 * @param {Buffer} imageBuffer
	 */
	fillImage (keyIndex: KeyIndex, imageBuffer: Buffer) {
		StreamDeck.checkValidKeyIndex(keyIndex)

		if (imageBuffer.length !== BYTES_PER_ICON) {
			throw new RangeError(`Expected image buffer of length ${BYTES_PER_ICON}, got length ${imageBuffer.length}`)
		}

		this.fillImageRange(keyIndex, imageBuffer, 0, ICON_SIZE * 3)
	}

	/**
	 * Fills the whole panel with an image in a Buffer.
	 *
	 * @param {Buffer} imageBuffer
	 */
	fillPanel (imageBuffer: Buffer) {
		if (imageBuffer.length !== BYTES_PER_ICON * NUM_KEYS) {
			throw new RangeError(`Expected image buffer of length ${BYTES_PER_ICON * NUM_KEYS}, got length ${imageBuffer.length}`)
		}

		for (let row = 0; row < NUM_BUTTON_ROWS; row++) {
			for (let column = 0; column < NUM_BUTTON_COLUMNS; column++) {
				const index = (row * NUM_BUTTON_COLUMNS) + NUM_BUTTON_COLUMNS - column - 1

				const stride = ICON_SIZE * 3 * NUM_BUTTON_COLUMNS
				const rowOffset = stride * row * ICON_SIZE
				const colOffset = column * ICON_SIZE * 3

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
		StreamDeck.checkValidKeyIndex(keyIndex)
		return this.fillColor(keyIndex, 0, 0, 0)
	}

	/**
	 * Clears all keys.
	 */
	clearAllKeys () {
		for (let keyIndex = 0; keyIndex < NUM_KEYS; keyIndex++) {
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

		const brightnessCommandBuffer = Buffer.from([0x05, 0x55, 0xaa, 0xd1, 0x01, percentage])
		this.sendFeatureReport(StreamDeck.padBufferToLength(brightnessCommandBuffer, 17))
	}

	/**
	 * Resets the display to the startup logo
	 */
	resetToLogo () {
		const brightnessCommandBuffer = Buffer.from([0x0B, 0x63])
		this.sendFeatureReport(StreamDeck.padBufferToLength(brightnessCommandBuffer, 17))
	}

	/**
	 * Get firmware version from Stream Deck
	 */
	getFirmwareVersion () {
		return this.device.getFeatureReport(4, 17).slice(5).map(function(val){
			return String.fromCharCode(val)
		}).join('')
	}

	/**
	 * Get serial number from Stream Deck
	 */
	getSerialNumber () {
		return this.device.getFeatureReport(3, 17).slice(5).map(function(val){
			return String.fromCharCode(val)
		}).join('')
	}

	private fillImageRange (keyIndex: KeyIndex, imageBuffer: Buffer, offset: number, stride: number) {
		StreamDeck.checkValidKeyIndex(keyIndex)

		let pixels: number[] = []
		for (let r = 0; r < ICON_SIZE; r++) {
			const row = []
			const start = r * stride + offset
			for (let i = start; i < start + (ICON_SIZE * 3); i += 3) {
				const r = imageBuffer.readUInt8(i)
				const g = imageBuffer.readUInt8(i + 1)
				const b = imageBuffer.readUInt8(i + 2)
				row.push(r, g, b)
			}
			pixels = pixels.concat(row.reverse())
		}

		const firstPagePixels = pixels.slice(0, NUM_FIRST_PAGE_PIXELS * 3)
		const secondPagePixels = pixels.slice(NUM_FIRST_PAGE_PIXELS * 3, NUM_TOTAL_PIXELS * 3)
		this._writePage1(keyIndex, Buffer.from(firstPagePixels))
		this._writePage2(keyIndex, Buffer.from(secondPagePixels))
	}

	/**
	 * Writes a Stream Deck's page 1 headers and image data to the Stream Deck.
	 *
	 * @private
	 * @param {number} keyIndex The key to write to 0 - 14
	 * @param {Buffer} buffer Image data for page 1
	 * @returns {undefined}
	 */
	private _writePage1 (keyIndex: KeyIndex, buffer: Buffer) {
		const header = Buffer.from([
			0x02, 0x01, 0x01, 0x00, 0x00, keyIndex + 1, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x42, 0x4d, 0xf6, 0x3c, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x36, 0x00, 0x00, 0x00, 0x28, 0x00,
			0x00, 0x00, 0x48, 0x00, 0x00, 0x00, 0x48, 0x00,
			0x00, 0x00, 0x01, 0x00, 0x18, 0x00, 0x00, 0x00,
			0x00, 0x00, 0xc0, 0x3c, 0x00, 0x00, 0xc4, 0x0e,
			0x00, 0x00, 0xc4, 0x0e, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		])

		const packet = StreamDeck.padBufferToLength(Buffer.concat([header, buffer]), PAGE_PACKET_SIZE)
		this.write(packet)
	}

	/**
	 * Writes a Stream Deck's page 2 headers and image data to the Stream Deck.
	 *
	 * @private
	 * @param {number} keyIndex The key to write to 0 - 14
	 * @param {Buffer} buffer Image data for page 2
	 * @returns {undefined}
	 */
	private _writePage2 (keyIndex: KeyIndex, buffer: Buffer) {
		const header = Buffer.from([
			0x02, 0x01, 0x02, 0x00, 0x01, keyIndex + 1, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
		])

		const packet = StreamDeck.padBufferToLength(Buffer.concat([header, buffer]), PAGE_PACKET_SIZE)
		this.write(packet)
	}
}

module.exports = StreamDeck
