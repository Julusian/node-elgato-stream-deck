'use strict';

// Native
const EventEmitter = require('events');

// Packages
const HID = require('node-hid');

const NUM_KEYS = 15;
const keyState = new Array(NUM_KEYS).fill(false);
const emitter = new EventEmitter();
const devices = HID.devices();
const streamDecks = devices.filter(device => {
	return device.product === 'Stream Deck' && device.manufacturer === 'Elgato Systems';
});

if (streamDecks.length > 1) {
	throw new Error('More than one Stream Deck is connected. This is unsupported at this time.');
}

const streamDeck = new HID.HID(streamDecks[0].path);

streamDeck.on('data', data => {
	for (let i = 0; i < NUM_KEYS; i++) {
		const keyPressed = Boolean(data[i + 1]);
		if (keyPressed !== keyState[i]) {
			if (keyPressed) {
				emitter.emit('down', i);
			} else {
				emitter.emit('up', i);
			}
		}

		keyState[i] = keyPressed;
	}
});

streamDeck.on('error', err => {
	emitter.emit('error', err);
});

module.exports = emitter;
