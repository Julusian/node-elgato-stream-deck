const path = require('path')
const sharp = require('sharp')
const { listStreamDecks, openStreamDeck } = require('../dist/index')

;(async () => {
	const devices = await listStreamDecks()
	if (!devices[0]) throw new Error('No device found')

	const streamDeck = await openStreamDeck(devices[0].path)
	await streamDeck.clearPanel()

	const img = await sharp(path.resolve(__dirname, 'fixtures/github_logo.png'))
		.flatten()
		.resize(streamDeck.BUTTON_WIDTH_PX, streamDeck.BUTTON_HEIGHT_PX)
		.raw()
		.toBuffer()

	streamDeck.on('down', (control) => {
		// Fill the pressed key with an image of the GitHub logo.
		console.log('Filling button #%d', control.index)
		if (control.feedbackType === 'lcd') {
			streamDeck.fillKeyBuffer(control.index, img).catch((e) => console.error('Fill failed:', e))
		} else {
			streamDeck.fillKeyColor(control.index, 255, 255, 255).catch((e) => console.error('Fill failed:', e))
		}
	})

	streamDeck.on('up', (control) => {
		// Clear the key when it is released.
		console.log('Clearing button #%d', control.index)
		streamDeck.clearKey(control.index).catch((e) => console.error('Clear failed:', e))
	})

	streamDeck.on('error', (error) => {
		console.error(error)
	})
})()
