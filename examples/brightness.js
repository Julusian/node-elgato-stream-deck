'use strict';

const streamDeck = require('../index');

// Fill it white so we can see the brightness changes
for (let i = 0; i < 15; i++) {
	streamDeck.fillColor(i, 255, 255, 255);
}

streamDeck.on('down', keyIndex => {
	const percentage = (100 / 14) * keyIndex;
	streamDeck.setBrightness(percentage);
});

streamDeck.on('error', error => {
	console.error(error);
});
