// @ts-check
const path = require('path')
// eslint-disable-next-line node/no-missing-require
const Jimp = require('jimp')
const { listStreamDecks, openStreamDeck } = require('../dist/index')

;(async () => {
	const devices = await listStreamDecks()
	if (!devices[0]) throw new Error('No device found')

	const streamDeck = await openStreamDeck(devices[0].path)
	streamDeck.clearPanel()

	const bmpImg = await Jimp.read(path.resolve(__dirname, 'fixtures/github_logo.png')).then((img) => {
		return img.resize(streamDeck.BUTTON_WIDTH_PX, streamDeck.BUTTON_HEIGHT_PX)
	})

	const img = bmpImg.bitmap.data

	streamDeck.on('down', (control) => {
		if (control.type !== 'button') return

		// Fill the pressed key with an image of the GitHub logo.
		console.log('Filling button #%d', control.index)
		if (control.feedbackType === 'lcd') {
			streamDeck
				.fillKeyBuffer(control.index, img, { format: 'rgba' })
				.catch((e) => console.error('Fill failed:', e))
		} else {
			streamDeck.fillKeyColor(control.index, 255, 255, 255).catch((e) => console.error('Fill failed:', e))
		}
	})

	streamDeck.on('up', (control) => {
		if (control.type !== 'button') return

		// Clear the key when it is released.
		console.log('Clearing button #%d', control.index)
		streamDeck.clearKey(control.index).catch((e) => console.error('Clear failed:', e))
	})

	streamDeck.on('error', (error) => {
		console.error(error)
	})
})()
