'use strict';

const streamDeck = require('../index');

streamDeck.on('error', error => {
	console.error(error);
});

setInterval(() => {
	const r = getRandomIntInclusive(0, 255);
	const g = getRandomIntInclusive(0, 255);
	const b = getRandomIntInclusive(0, 255);
	for (let i = 0; i < 15; i++) {
		streamDeck.fillColor(i, r, g, b);
	}
}, 1000 / 5);

function getRandomIntInclusive(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
