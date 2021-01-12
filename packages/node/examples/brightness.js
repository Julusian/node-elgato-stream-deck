const { openStreamDeck } = require('../dist/index')
const streamDeck = openStreamDeck()

// Fill it white so we can see the brightness changes
for (let i = 0; i < streamDeck.NUM_KEYS; i++) {
	streamDeck.fillKeyColor(i, 255, 255, 255)
}

streamDeck.on('down', (keyIndex) => {
	const percentage = (100 / (streamDeck.NUM_KEYS - 1)) * keyIndex
	console.log(`Setting brightness to ${percentage.toFixed(2)}%`)
	streamDeck.setBrightness(percentage)
})

streamDeck.on('error', (error) => {
	console.error(error)
})
