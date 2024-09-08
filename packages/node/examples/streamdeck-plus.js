// @ts-check
const path = require('path')
const sharp = require('sharp')
const { listStreamDecks, openStreamDeck, DeviceModelId } = require('../dist/index')

;(async () => {
	const devices = await listStreamDecks()
	const plusDevice = devices.find((dev) => dev.model === DeviceModelId.PLUS)
	if (!plusDevice) throw new Error('No device found')

	const streamDeck = await openStreamDeck(plusDevice.path)
	await streamDeck.clearPanel()

	if (streamDeck.MODEL !== DeviceModelId.PLUS) throw new Error('This demo only supports the plus')

	const img = await sharp(path.resolve(__dirname, 'fixtures/github_logo.png'))
		.flatten()
		.resize(streamDeck.BUTTON_WIDTH_PX, streamDeck.BUTTON_HEIGHT_PX)
		.raw()
		.toBuffer()

	const img3 = await sharp(path.resolve(__dirname, 'fixtures/github_logo.png'))
		.flatten()
		.resize(800, 100)
		.raw()
		.toBuffer()

	await streamDeck.fillLcdRegion(0, 0, 0, img3, {
		width: 800,
		height: 100,
		// stride: 800 * 3,
		// offset: 0,
		format: 'rgb',
	})

	streamDeck.on('down', (control) => {
		if (control.type === 'button') {
			// Fill the pressed key with an image of the GitHub logo.
			console.log('Filling button #%d', control.index)
			streamDeck.fillKeyBuffer(control.index, img).catch((e) => console.error('Fill failed:', e))
		} else {
			console.log('Encoder down #%d', control.index)
		}
	})

	streamDeck.on('up', (control) => {
		if (control.type === 'button') {
			// Clear the key when it is released.
			console.log('Clearing button #%d', control.index)
			streamDeck.clearKey(control.index).catch((e) => console.error('Clear failed:', e))
		} else {
			console.log('Encoder up #%d', control.index)
		}
	})

	streamDeck.on('rotate', (control, amount) => {
		console.log('Encoder rotate #%d (%d)', control.index, amount)
	})
	streamDeck.on('lcdShortPress', (control, pos) => {
		console.log('lcd short press #%d (%d, %d)', control.id, pos.x, pos.y)
	})
	streamDeck.on('lcdLongPress', (control, pos) => {
		console.log('lcd long press #%d (%d, %d)', control.id, pos.x, pos.y)
	})
	streamDeck.on('lcdSwipe', (control, from, to) => {
		console.log('lcd swipe #%d (%d, %d)->(%d, %d)', control.id, from.x, from.y, to.x, to.y)
	})

	streamDeck.on('error', (error) => {
		console.error(error)
	})
})()
