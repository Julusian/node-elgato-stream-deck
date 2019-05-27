'use strict';

const path = require('path');
const sharp = require('sharp');
const StreamDeck = require('../dist/index');

(async () => {
	const img = await sharp(path.resolve(__dirname, 'fixtures/github_logo.png'))
	.flatten()
	.resize(StreamDeck.ICON_SIZE, StreamDeck.ICON_SIZE)
	.raw()
	.toBuffer()

	const streamDeck = new StreamDeck();

	streamDeck.on('down', keyIndex => {
		// Fill the pressed key with an image of the GitHub logo.
		console.log('Filling button #%d', keyIndex);
		streamDeck.fillImage(keyIndex, img);
	});

	streamDeck.on('up', keyIndex => {
		// Clear the key when it is released.
		console.log('Clearing button #%d', keyIndex);
		streamDeck.clearKey(keyIndex);
	});

	streamDeck.on('error', error => {
		console.error(error);
	});
})()

