const { openStreamDeck, listStreamDecks } = require('../dist/index')

listStreamDecks().then(async (devices) => {
	if (!devices[0]) throw new Error('No device found')

	openStreamDeck(devices[0].path).then((streamDeck) => {
		streamDeck.on('error', (error) => {
			console.error(error)
		})

		let isFilling = false
		setInterval(() => {
			if (isFilling) return
			isFilling = true

			Promise.resolve().then(async () => {
				try {
					const r = getRandomIntInclusive(0, 255)
					const g = getRandomIntInclusive(0, 255)
					const b = getRandomIntInclusive(0, 255)
					console.log('Filling with rgb(%d, %d, %d)', r, g, b)
					for (let i = 0; i < streamDeck.NUM_KEYS + streamDeck.NUM_TOUCH_KEYS; i++) {
						await streamDeck.fillKeyColor(i, r, g, b)
					}

					if (streamDeck.LCD_STRIP_SIZE) {
						const lcdBuffer = Buffer.alloc(
							streamDeck.LCD_STRIP_SIZE.width * streamDeck.LCD_STRIP_SIZE.height * 4
						).fill(Buffer.from([r, g, b, 255]))
						await streamDeck.fillLcd(lcdBuffer, { format: 'rgba' })
					}
				} catch (e) {
					console.error('Fill failed:', e)
				} finally {
					isFilling = false
				}
			})
		}, 1000 / 5)

		function getRandomIntInclusive(min, max) {
			min = Math.ceil(min)
			max = Math.floor(max)
			return Math.floor(Math.random() * (max - min + 1)) + min
		}
	})
})
