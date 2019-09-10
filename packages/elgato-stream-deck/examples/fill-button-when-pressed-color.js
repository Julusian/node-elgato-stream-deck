const { openStreamDeck } = require('../dist/index')

const streamDeck = openStreamDeck()
streamDeck.clearAllKeys()

streamDeck.on('down', keyIndex => {
	// Fill the pressed key with an image of the GitHub logo.
	console.log('Filling button #%d', keyIndex)
	streamDeck.fillColor(keyIndex, 255, 0, 0)
})

streamDeck.on('up', keyIndex => {
	// Clear the key when it is released.
	console.log('Clearing button #%d', keyIndex)
	streamDeck.clearKey(keyIndex)
})

streamDeck.on('error', error => {
	console.error(error)
})
