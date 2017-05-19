'use strict';

// Native
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// Packages
const mockery = require('mockery');
const sinon = require('sinon');
const test = require('ava');

mockery.registerMock('node-hid', {
	devices() {
		return [{
			vendorId: 0x0fd9,
			productId: 0x0060,
			path: 'foo'
		}];
	},
	HID: class extends EventEmitter {
		constructor() {
			super();
			this.write = sinon.spy();
		}
	}
});
mockery.enable({
	warnOnUnregistered: false
});

// Must be required after we register a mock for `node-hid`.
const streamDeck = require('../index');

test('fillColor', t => {
	t.plan(2);

	streamDeck.fillColor(0, 255, 0, 0);
	const callCount = streamDeck.device.write.callCount;
	const page1WriteArgs = streamDeck.device.write.getCall(callCount - 2).args[0];
	const page2WriteArgs = streamDeck.device.write.getCall(callCount - 1).args[0];
	t.deepEqual(page1WriteArgs, readFixtureJSON('fillColor-red-page1.json'));
	t.deepEqual(page2WriteArgs, readFixtureJSON('fillColor-red-page2.json'));
});

function readFixtureJSON(fileName) {
	const filePath = path.resolve(__dirname, 'fixtures', fileName);
	const fileData = fs.readFileSync(filePath);
	return JSON.parse(fileData);
}
