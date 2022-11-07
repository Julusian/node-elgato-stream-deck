const path = require('path')
const sharp = require('sharp')
const { openStreamDeck } = require('../dist/index')

;(async () => {
	const streamDeck = openStreamDeck()
	streamDeck.clearPanel()

	const img = await sharp(path.resolve(__dirname, 'fixtures/github_logo.png'))
		.flatten()
		.resize(streamDeck.ICON_SIZE, streamDeck.ICON_SIZE)
		.raw()
		.toBuffer()

	const img2 = await sharp(path.resolve(__dirname, 'fixtures/github_logo.png'))
		.flatten()
		.resize(40, 40)
		.raw()
		.toBuffer()

	const img3 = await sharp(path.resolve(__dirname, 'fixtures/github_logo.png'))
		.flatten()
		.resize(800, 100)
		.raw()
		.toBuffer()

	await streamDeck.fillLcdRegion(0, 0, img3, {
		width: 800,
		height: 100,
		stride: 800 * 3,
		offset: 0,
		format: 'rgb',
	})
	// await streamDeck.fillLcdRegion(50, 0, img2, {
	// 	width: 40,
	// 	height: 40,
	// 	stride: 40 * 3,
	// 	offset: 0,
	// 	format: 'rgb',
	// })

	await streamDeck.fillLcdRegion(500, 50, img2, {
		width: 40,
		height: 40,
		stride: 40 * 3,
		offset: 0,
		format: 'rgb',
	})

	streamDeck.on('down', (keyIndex) => {
		// Fill the pressed key with an image of the GitHub logo.
		console.log('Filling button #%d', keyIndex)
		streamDeck.fillKeyBuffer(keyIndex, img).catch((e) => console.error('Fill failed:', e))
	})

	streamDeck.on('up', (keyIndex) => {
		// Clear the key when it is released.
		console.log('Clearing button #%d', keyIndex)
		streamDeck.clearKey(keyIndex).catch((e) => console.error('Clear failed:', e))
	})

	streamDeck.on('encoderDown', (index) => {
		console.log('Encoder down #%d', index)
	})
	streamDeck.on('encoderUp', (index) => {
		console.log('Encoder up #%d', index)
	})
	streamDeck.on('rotateLeft', (index) => {
		console.log('Encoder left #%d', index)
	})
	streamDeck.on('rotateRight', (index) => {
		console.log('Encoder right #%d', index)
	})
	streamDeck.on('lcdPress', (index, x, y) => {
		console.log('lcd press #%d (%d, %d)', index, x, y)
	})

	streamDeck.on('error', (error) => {
		console.error(error)
	})
})()
