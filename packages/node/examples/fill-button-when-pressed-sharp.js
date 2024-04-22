const path = require('path')
const sharp = require('sharp')
const { openStreamDeck } = require('../dist/index')

;(async () => {
	const streamDeck = await openStreamDeck('/dev/hidraw11')
	streamDeck.clearPanel()

	const img = await sharp(path.resolve(__dirname, 'fixtures/github_logo.png'))
		.flatten()
		.resize(streamDeck.ICON_SIZE, streamDeck.ICON_SIZE)
		.raw()
		.toBuffer()

	streamDeck.on('down', (keyIndex) => {
		// Fill the pressed key with an image of the GitHub logo.
		console.log('Filling button #%d', keyIndex)
		if (keyIndex >= streamDeck.NUM_KEYS) {
			streamDeck.fillKeyColor(keyIndex, 0, 0, 255).catch((e) => console.error('Fill failed:', e))
		} else {
			streamDeck.fillKeyBuffer(keyIndex, img).catch((e) => console.error('Fill failed:', e))
		}
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
