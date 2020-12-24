const path = require('path')
const fs = require('fs')
const jpegJS = require('jpeg-js')
const { openStreamDeck } = require('../dist/index')

;(async () => {
	const streamDeck = openStreamDeck()
	streamDeck.clearAllKeys()

	const rawFile = fs.readFileSync(path.resolve(__dirname, `fixtures/github_logo_${streamDeck.ICON_SIZE}.jpg`))
	const img = jpegJS.decode(rawFile).data

	streamDeck.on('down', (keyIndex) => {
		// Fill the pressed key with an image of the GitHub logo.
		console.log('Filling button #%d', keyIndex)
		streamDeck.fillImage(keyIndex, img, { format: 'rgba' })
	})

	streamDeck.on('up', (keyIndex) => {
		// Clear the key when it is released.
		console.log('Clearing button #%d', keyIndex)
		streamDeck.clearKey(keyIndex)
	})

	streamDeck.on('error', (error) => {
		console.error(error)
	})
})()
