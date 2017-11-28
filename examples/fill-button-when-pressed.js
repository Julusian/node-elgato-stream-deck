'use strict';

const path = require('path');
const StreamDeck = require('../index');
const streamDeck = new StreamDeck();

streamDeck.on('down', keyIndex => {
	// Fill the pressed key with an image of the GitHub logo.
	console.log('Filling button #%d', keyIndex);
	streamDeck.fillImageFromFile(keyIndex, path.resolve(__dirname, 'fixtures/github_logo.png'))
		.catch(error => {
			console.error(error);
		});
});

streamDeck.on('up', keyIndex => {
	// Clear the key when it is released.
	console.log('Clearing button #%d', keyIndex);
	streamDeck.clearKey(keyIndex);
});

streamDeck.on('error', error => {
	console.error(error);
});
