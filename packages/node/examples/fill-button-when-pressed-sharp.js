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

	streamDeck.on('error', (error) => {
		console.error(error)
	})
})()
