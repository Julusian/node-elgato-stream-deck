'use strict';

// Native
const EventEmitter = require('events');

// Packages
const mockery = require('mockery');
const sinon = require('sinon');
const test = require('ava');

// Ours
const {validateWriteCall} = require('./helpers');

class DummyHID extends EventEmitter {
	constructor(devicePath) {
		super();
		this.write = sinon.spy();
		this.sendFeatureReport = sinon.spy();
		this.path = devicePath;
	}
}

const mockNodeHID = {
	devices() {
		return [{
			vendorId: 0x0fd9,
			productId: 0x0060,
			path: 'foo'
		}];
	},
	HID: DummyHID
};
mockery.registerMock('node-hid', mockNodeHID);

mockery.enable({
	warnOnUnregistered: false
});

// Must be required after we register a mock for `node-hid`.
const StreamDeck = require('../');

test.beforeEach(t => {
	t.context.streamDeck = new StreamDeck();
});

test('constructor uses the provided devicePath', t => {
	const devicePath = 'some_random_path_here';
	const streamDeck = new StreamDeck(devicePath);
	t.is(streamDeck.device.path, devicePath);
});

test('errors if no devicePath is provided and there are no connected Stream Decks', t => {
	const devicesStub = sinon.stub(mockNodeHID, 'devices');
	devicesStub.returns([]);
	t.throws(() => {
		new StreamDeck(); // eslint-disable-line no-new
	}, /No Stream Decks are connected./);
	devicesStub.restore();
});

test('fillColor', t => {
	const streamDeck = t.context.streamDeck;
	streamDeck.fillColor(0, 255, 0, 0);
	validateWriteCall(
		t,
		streamDeck.device.write,
		[
			'fillColor-red-page1.json',
			'fillColor-red-page2.json'
		]
	);
});

test('checkRGBValue', t => {
	const streamDeck = t.context.streamDeck;
	t.throws(() => streamDeck.fillColor(0, 256, 0, 0));
	t.throws(() => streamDeck.fillColor(0, 0, 256, 0));
	t.throws(() => streamDeck.fillColor(0, 0, 0, 256));
	t.throws(() => streamDeck.fillColor(0, -1, 0, 0));
});

test('checkValidKeyIndex', t => {
	const streamDeck = t.context.streamDeck;
	t.throws(() => streamDeck.clearKey(-1));
	t.throws(() => streamDeck.clearKey(15));
});

test('clearKey', t => {
	const streamDeck = t.context.streamDeck;
	const fillColorSpy = sinon.spy(streamDeck, 'fillColor');
	streamDeck.clearKey(0);
	t.true(fillColorSpy.calledOnce);
	t.deepEqual(fillColorSpy.firstCall.args, [0, 0, 0, 0]);
});

test('clearAllKeys', t => {
	const streamDeck = t.context.streamDeck;
	const clearKeySpy = sinon.spy(streamDeck, 'clearKey');
	streamDeck.clearAllKeys();
	t.is(clearKeySpy.callCount, 15);
	for (let i = 0; i < 15; i++) {
		t.true(clearKeySpy.calledWithExactly(i));
	}
});

test('down and up events', t => {
	const streamDeck = t.context.streamDeck;
	const downSpy = sinon.spy();
	const upSpy = sinon.spy();
	streamDeck.on('down', key => downSpy(key));
	streamDeck.on('up', key => upSpy(key));
	streamDeck.device.emit('data', Buffer.from([0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
	streamDeck.device.emit('data', Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));

	t.is(downSpy.getCall(0).args[0], 0);
	t.is(upSpy.getCall(0).args[0], 0);
});

test.cb('forwards error events from the device', t => {
	const streamDeck = t.context.streamDeck;
	streamDeck.on('error', () => {
		t.pass();
		t.end();
	});
	streamDeck.device.emit('error', new Error('Test'));
});

test('fillImage throws on undersized buffers', t => {
	const streamDeck = t.context.streamDeck;
	const smallBuffer = Buffer.alloc(1);
	t.throws(() => streamDeck.fillImage(0, smallBuffer));
});

test('setBrightness', t => {
	const streamDeck = t.context.streamDeck;
	streamDeck.setBrightness(100);
	streamDeck.setBrightness(0);

	t.deepEqual(streamDeck.device.sendFeatureReport.getCall(1).args[0], [0x05, 0x55, 0xaa, 0xd1, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
	t.deepEqual(streamDeck.device.sendFeatureReport.getCall(0).args[0], [0x05, 0x55, 0xaa, 0xd1, 0x01, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

	t.throws(() => streamDeck.setBrightness(101));
	t.throws(() => streamDeck.setBrightness(-1));
});
