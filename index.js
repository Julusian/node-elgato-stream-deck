'use strict';

// Native
const EventEmitter = require('events');

// Packages
const HID = require('node-hid');
const sharp = require('sharp');

const NUM_KEYS = 15;
const PAGE_PACKET_SIZE = 8191;
const NUM_FIRST_PAGE_PIXELS = 2583;
const NUM_SECOND_PAGE_PIXELS = 2601;
const ICON_SIZE = 72;
const NUM_TOTAL_PIXELS = NUM_FIRST_PAGE_PIXELS + NUM_SECOND_PAGE_PIXELS;

const devices = HID.devices();
const connectedStreamDecks = devices.filter(device => {
	return device.vendorId === 0x0fd9 && device.productId === 0x0060;
});

/* istanbul ignore if  */
if (connectedStreamDecks.length > 1) {
	throw new Error('More than one Stream Deck is connected. This is unsupported at this time.');
}

/* istanbul ignore if  */
if (connectedStreamDecks.length < 1) {
	throw new Error('No Stream Decks are connected.');
}

class StreamDeck extends EventEmitter {
	constructor(device) {
		super();
		this.device = device;
		this.keyState = new Array(NUM_KEYS).fill(false);

		this.device.on('data', data => {
			// The first byte is a report ID, the last byte appears to be padding
			// strip these out for now.
			data = data.slice(1, data.length - 1);

			for (let i = 0; i < NUM_KEYS; i++) {
				const keyPressed = Boolean(data[i]);
				if (keyPressed !== this.keyState[i]) {
					if (keyPressed) {
						this.emit('down', i);
					} else {
						this.emit('up', i);
					}
				}

				this.keyState[i] = keyPressed;
			}
		});

		this.device.on('error', err => {
			this.emit('error', err);
		});
	}

	/**
	 * Writes a Buffer to the Stream Deck.
	 *
	 * @param {Buffer} buffer The buffer written to the Stream Deck
	 * @returns undefined
	 */
	write(buffer) {
		return this.device.write(StreamDeck.bufferToIntArray(buffer));
	}

	/**
	 * Fills the given key with a solid color.
	 *
	 * @param {number} keyIndex The key to fill 0 - 14
	 * @param {number} r The color's red value. 0 - 255
	 * @param {number} g The color's green value. 0 - 255
	 * @param {number} b The color's blue value. 0 -255
	 */
	fillColor(keyIndex, r, g, b) {
		StreamDeck.checkValidKeyIndex(keyIndex);

		StreamDeck.checkRGBValue(r);
		StreamDeck.checkRGBValue(g);
		StreamDeck.checkRGBValue(b);

		const pixel = Buffer.from([b, g, r]);
		this._writePage1(keyIndex, Buffer.alloc(NUM_FIRST_PAGE_PIXELS * 3, pixel));
		this._writePage2(keyIndex, Buffer.alloc(NUM_SECOND_PAGE_PIXELS * 3, pixel));
	}

	/**
	 * Checks a value is a valid RGB value. A number between 0 and 255.
	 *
	 * @static
	 * @param {number} value The number to check
	 */
	static checkRGBValue(value) {
		if (value < 0 || value > 255) {
			throw new TypeError('Expected a valid color RGB value 0 - 255');
		}
	}

	/**
	 * Checks a keyIndex is a valid key for a stream deck. A number between 0 and 14.
	 *
	 * @static
	 * @param {number} keyIndex The keyIndex to check
	 */
	static checkValidKeyIndex(keyIndex) {
		if (keyIndex < 0 || keyIndex > 14) {
			throw new TypeError('Expected a valid keyIndex 0 - 14');
		}
	}

	/**
	 * Fills the given key with an image in a Buffer.
	 *
	 * @param {number} keyIndex The key to fill 0 - 14
	 * @param {Buffer} imageBuffer
	 */
	fillImage(keyIndex, imageBuffer) {
		StreamDeck.checkValidKeyIndex(keyIndex);

		if (imageBuffer.length !== 15552) {
			throw new RangeError(`Expected image buffer of length 15552, got length ${imageBuffer.length}`);
		}

		let pixels = [];
		for (let r = 0; r < ICON_SIZE; r++) {
			const row = [];
			const start = r * 3 * ICON_SIZE;
			for (let i = start; i < start + (ICON_SIZE * 3); i += 3) {
				const r = imageBuffer.readUInt8(i);
				const g = imageBuffer.readUInt8(i + 1);
				const b = imageBuffer.readUInt8(i + 2);
				row.push(b, g, r);
			}
			pixels = pixels.concat(row.reverse());
		}

		const firstPagePixels = pixels.slice(0, NUM_FIRST_PAGE_PIXELS * 3);
		const secondPagePixels = pixels.slice(NUM_FIRST_PAGE_PIXELS * 3, NUM_TOTAL_PIXELS * 3);
		this._writePage1(keyIndex, Buffer.from(firstPagePixels));
		this._writePage2(keyIndex, Buffer.from(secondPagePixels));
	}

	/**
	 * Fill's the given key with an image from a file.
	 *
	 * @param {number} keyIndex The key to fill 0 - 14
	 * @param {String} filePath A file path to an image file
	 * @returns {Promise<void>} Resolves when the file has been written
	 */
	fillImageFromFile(keyIndex, filePath) {
		StreamDeck.checkValidKeyIndex(keyIndex);

		return sharp(filePath)
			.flatten() // Eliminate alpha channel, if any.
			.resize(this.ICON_SIZE)
			.raw()
			.toBuffer()
			.then(buffer => {
				return this.fillImage(keyIndex, buffer);
			});
	}

	/**
	 * Clears the given key.
	 *
	 * @param {number} keyIndex The key to clear 0 - 14
	 * @returns {undefined}
	 */
	clearKey(keyIndex) {
		StreamDeck.checkValidKeyIndex(keyIndex);

		return this.fillColor(keyIndex, 0, 0, 0);
	}

	/**
	 * Writes a Stream Deck's page 1 headers and image data to the Stream Deck.
	 *
	 * @private
	 * @param {number} keyIndex The key to write to 0 - 14
	 * @param {Buffer} buffer Image data for page 1
	 * @returns {undefined}
	 */
	_writePage1(keyIndex, buffer) {
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
		]);

		const packet = this._padToLength(Buffer.concat([header, buffer]), PAGE_PACKET_SIZE);
		return this.write(packet);
	}

	/**
	 * Writes a Stream Deck's page 2 headers and image data to the Stream Deck.
	 *
	 * @private
	 * @param {number} keyIndex The key to write to 0 - 14
	 * @param {Buffer} buffer Image data for page 2
	 * @returns {undefined}
	 */
	_writePage2(keyIndex, buffer) {
		const header = Buffer.from([0x02, 0x01, 0x02, 0x00, 0x01, keyIndex + 1]);
		const packet = this._padToLength(Buffer.concat([header, this._pad(10), buffer]), PAGE_PACKET_SIZE);
		return this.write(packet);
	}

	/**
	 * Pads a given buffer till padLength with 0s.
	 *
	 * @private
	 * @param {Buffer} buffer Buffer to pad
	 * @param {number} padLength The length to pad to
	 * @returns {Buffer} The Buffer padded to the length requested
	 */
	_padToLength(buffer, padLength) {
		return Buffer.concat([buffer, this._pad(padLength - buffer.length)]);
	}

	/**
	 * Returns an empty buffer (filled with zeroes) of the given length
	 *
	 * @private
	 * @param {number} padLength Length of the buffer
	 * @returns {Buffer}
	 */
	_pad(padLength) {
		return Buffer.alloc(padLength);
	}

	/**
	 * The pixel size of an icon written to the Stream Deck key.
	 *
	 * @readonly
	 */
	get ICON_SIZE() {
		return ICON_SIZE;
	}

	/**
	 * Converts a buffer into an number[]. Used to supply the underlying
	 * node-hid device with the format it accepts.
	 *
	 * @static
	 * @param {Buffer} buffer Buffer to convert
	 * @returns {number[]} the converted buffer
	 */
	static bufferToIntArray(buffer) {
		const array = [];
		for (const pair of buffer.entries()) {
			array.push(pair[1]);
		}
		return array;
	}
}

module.exports = new StreamDeck(new HID.HID(connectedStreamDecks[0].path));
