const path = require('path')
const Jimp = require('jimp')
const { openStreamDeck } = require('../dist/index')

;(async () => {
	const streamDeck = openStreamDeck()
	streamDeck.clearAllKeys()

	const bmpImg = await Jimp.read(path.resolve(__dirname, 'fixtures/github_logo.png')).then((img) => {
		return img.resize(streamDeck.ICON_SIZE, streamDeck.ICON_SIZE)
	})

	const img = bmpImg.bitmap.data

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
