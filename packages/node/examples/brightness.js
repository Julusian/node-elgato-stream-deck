const { listStreamDecks, openStreamDeck } = require('../dist/index')

;(async () => {
	const devices = await listStreamDecks()
	if (!devices[0]) throw new Error('No device found')

	const streamDeck = await openStreamDeck(devices[0].path)
	// Fill it white so we can see the brightness changes
	for (let i = 0; i < streamDeck.NUM_KEYS + streamDeck.NUM_TOUCH_KEYS; i++) {
		streamDeck.fillKeyColor(i, 255, 255, 255).catch((e) => console.error('Fill failed:', e))
	}
	if (streamDeck.LCD_STRIP_SIZE) {
		const buffer = Buffer.alloc(streamDeck.LCD_STRIP_SIZE.width * streamDeck.LCD_STRIP_SIZE.height * 3).fill(
			Buffer.from([255, 255, 255])
		)
		streamDeck.fillLcd(buffer, { format: 'rgb' }).catch((e) => console.error('Fill lcd failed:', e))
	}

	streamDeck.on('down', (keyIndex) => {
		const percentage = (100 / (streamDeck.NUM_KEYS + streamDeck.NUM_TOUCH_KEYS - 1)) * keyIndex
		console.log(`Setting brightness to ${percentage.toFixed(2)}%`)
		streamDeck.setBrightness(percentage).catch((e) => console.error('Set brightness failed:', e))
	})

	streamDeck.on('error', (error) => {
		console.error(error)
	})
})()
