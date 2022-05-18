const path = require('path')
const fs = require('fs')
const jpegJS = require('jpeg-js')
const { openStreamDeck } = require('../dist/index')

;(async () => {
	const streamDeck = openStreamDeck()
	streamDeck.clearPanel()

	const rawFile = fs.readFileSync(path.resolve(__dirname, `fixtures/github_logo_${streamDeck.ICON_SIZE}.jpg`))
	const img = jpegJS.decode(rawFile).data

	streamDeck.on('down', (keyIndex) => {
		// Fill the pressed key with an image of the GitHub logo.
		console.log('Filling button #%d', keyIndex)
		streamDeck.fillKeyBuffer(keyIndex, img, { format: 'rgba' }).catch((e) => console.error('Fill failed:', e))
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
