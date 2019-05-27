'use strict';

const path = require('path');
const sharp = require('sharp');
const StreamDeck = require('../dist/index');

console.log('Press keys 0-7 to show the first image, and keys 8-15 to show the second image.');

(async () => {
	const streamDeck = new StreamDeck();

	const imgField = await sharp(path.resolve(__dirname, 'fixtures/sunny_field.png'))
		.flatten()
		.resize(streamDeck.ICON_SIZE * 5, streamDeck.ICON_SIZE * 3)
		.raw()
		.toBuffer()
	const imgMosaic = await sharp(path.resolve(__dirname, '../src/__tests__/fixtures/mosaic.png'))
		.flatten()
		.resize(streamDeck.ICON_SIZE * 5, streamDeck.ICON_SIZE * 3)
		.raw()
		.toBuffer()

	let filled = false;
	streamDeck.on('down', keyIndex => {
		if (filled) {
			return;
		}

		filled = true;

		let image;
		if (keyIndex > 7) {
			console.log('Filling entire panel with an image of a sunny field.');
			image = imgField
		} else {
			console.log('Filling entire panel with a mosaic which will show each key as a different color.');
			image = imgMosaic
		}

		streamDeck.fillPanel(image);
	});

	streamDeck.on('up', () => {
		if (!filled) {
			return;
		}

		// Clear the key when all keys are released.
		if (streamDeck.keyState.every(pressed => !pressed)) {
			console.log('Clearing all buttons');
			streamDeck.clearAllKeys();
			filled = false;
		}
	});

	streamDeck.on('error', error => {
		console.error(error);
	});

})()

