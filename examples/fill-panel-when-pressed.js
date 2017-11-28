'use strict';

const path = require('path');
const StreamDeck = require('../index');
const streamDeck = new StreamDeck();

console.log('Press keys 0-7 to show the first image, and keys 8-15 to show the second image.');

let filled = false;
streamDeck.on('down', keyIndex => {
	if (filled) {
		return;
	}

	filled = true;

	let imagePath;
	if (keyIndex > 7) {
		console.log('Filling entire panel with an image of a sunny field.');
		imagePath = path.resolve(__dirname, 'fixtures/sunny_field.png');
	} else {
		console.log('Filling entire panel with a mosaic which will show each key as a different color.');
		imagePath = path.resolve(__dirname, '../test/fixtures/mosaic.png');
	}

	streamDeck.fillPanel(imagePath)
		.catch(error => {
			filled = false;
			console.error(error);
		});
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
