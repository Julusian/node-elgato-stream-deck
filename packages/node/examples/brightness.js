const { openStreamDeck } = require('../dist/index')

openStreamDeck().then((streamDeck) => {
	// Fill it white so we can see the brightness changes
	for (let i = 0; i < streamDeck.NUM_KEYS; i++) {
		streamDeck.fillKeyColor(i, 255, 255, 255).catch((e) => console.error('Fill failed:', e))
	}

	streamDeck.on('down', (keyIndex) => {
		const percentage = (100 / (streamDeck.NUM_KEYS - 1)) * keyIndex
		console.log(`Setting brightness to ${percentage.toFixed(2)}%`)
		streamDeck.setBrightness(percentage).catch((e) => console.error('Set brightness failed:', e))
	})

	streamDeck.on('error', (error) => {
		console.error(error)
	})
})
