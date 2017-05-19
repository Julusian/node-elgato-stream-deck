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

const keyState = new Array(NUM_KEYS).fill(false);
const devices = HID.devices();
const connectedStreamDecks = devices.filter(device => {
	return device.vendorId === 0x0fd9 && device.productId === 0x0060;
});

if (connectedStreamDecks.length > 1) {
	throw new Error('More than one Stream Deck is connected. This is unsupported at this time.');
}

if (connectedStreamDecks.length < 1) {
	throw new Error('No Stream Decks are connected.');
}

class StreamDeck extends EventEmitter {
	constructor(device) {
		super();
		this.device = device;

		this.device.on('data', data => {
			// The first byte is a report ID, the last byte appears to be padding
			// strip these out for now.
			data = data.slice(1, data.length - 1);

			for (let i = 0; i < NUM_KEYS; i++) {
				const keyPressed = Boolean(data[i]);
				if (keyPressed !== keyState[i]) {
					if (keyPressed) {
						this.emit('down', i);
					} else {
						this.emit('up', i);
					}
				}

				keyState[i] = keyPressed;
			}
		});

		this.device.on('error', err => {
			this.emit('error', err);
		});
	}

	write(buffer) {
		return this.device.write(StreamDeck.bufferToIntArray(buffer));
	}

	fillColor(keyIndex, r, g, b) {
		const pixel = Buffer.from([b, g, r]);
		this._writePage1(keyIndex, Buffer.alloc(NUM_FIRST_PAGE_PIXELS * 3, pixel));
		this._writePage2(keyIndex, Buffer.alloc(NUM_SECOND_PAGE_PIXELS * 3, pixel));
	}

	fillImage(keyIndex, imageBuffer) {
		if (imageBuffer.length !== 15552) {
			throw new Error(`Expected image buffer of length 15552, got length ${imageBuffer.length}`);
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

	fillImageFromFile(keyIndex, filePath) {
		return sharp(filePath)
			.flatten() // Eliminate alpha channel, if any.
			.resize(this.ICON_SIZE)
			.raw()
			.toBuffer()
			.then(buffer => {
				return this.fillImage(keyIndex, buffer);
			});
	}

	clearKey(keyIndex) {
		return this.fillColor(keyIndex, 0, 0, 0);
	}

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

	_writePage2(keyIndex, buffer) {
		const header = Buffer.from([0x02, 0x01, 0x02, 0x00, 0x01, keyIndex + 1]);
		const packet = this._padToLength(Buffer.concat([header, this._pad(10), buffer]), PAGE_PACKET_SIZE);
		return this.write(packet);
	}

	_padToLength(buffer, padLength) {
		return Buffer.concat([buffer, this._pad(padLength - buffer.length)]);
	}

	_pad(padLength) {
		return Buffer.alloc(padLength);
	}

	get ICON_SIZE() {
		return ICON_SIZE;
	}

	static bufferToIntArray(buffer) {
		const array = [];
		for (const pair of buffer.entries()) {
			array.push(pair[1]);
		}
		return array;
	}
}

module.exports = new StreamDeck(new HID.HID(connectedStreamDecks[0].path));
