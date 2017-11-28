'use strict';

const StreamDeck = require('../index');
const streamDeck = new StreamDeck();

// Fill it white so we can see the brightness changes
for (let i = 0; i < 15; i++) {
	streamDeck.fillColor(i, 255, 255, 255);
}

streamDeck.on('down', keyIndex => {
	const percentage = (100 / 14) * keyIndex;
	console.log(`Setting brightness to ${percentage.toFixed(2)}%`);
	streamDeck.setBrightness(percentage);
});

streamDeck.on('error', error => {
	console.error(error);
});
