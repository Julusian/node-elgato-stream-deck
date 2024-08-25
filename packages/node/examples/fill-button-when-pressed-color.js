// @ts-check
const { listStreamDecks, openStreamDeck } = require('../dist/index')

;(async () => {
	const devices = await listStreamDecks()
	if (!devices[0]) throw new Error('No device found')

	const streamDeck = await openStreamDeck(devices[0].path)
	await streamDeck.clearPanel()

	streamDeck.on('down', (control) => {
		if (control.type !== 'button') return

		// Fill the pressed key with an image of the GitHub logo.
		console.log('Filling button #%d', control.index)
		streamDeck.fillKeyColor(control.index, 255, 0, 0).catch((e) => console.error('Fill failed:', e))
	})

	streamDeck.on('up', (control) => {
		if (control.type !== 'button') return

		// Clear the key when it is released.
		console.log('Clearing button #%d', control.index)
		streamDeck.clearKey(control.index).catch((e) => console.error('Clear failed:', e))
	})

	const lcdPress = (
		/** @type {import('@elgato-stream-deck/core').StreamDeckLcdStripControlDefinition} */ control,
		/** @type {import('@elgato-stream-deck/core').LcdPosition} */ position,
	) => {
		if (control.type !== 'lcd-strip') return

		if (!control.drawRegions) {
			// This isn't possible with current models
			return
		}

		const leftEdge = Math.max(0, position.x - control.pixelSize.height / 2)
		const rightEdge = Math.min(control.pixelSize.width, position.x + control.pixelSize.height / 2)
		const width = rightEdge - leftEdge

		// Fill the pressed key with an image of the GitHub logo.
		console.log('Filling LCD #%d around %dpx', control.id, position.x)
		const redBuffer = Buffer.alloc(width * control.pixelSize.height * 3).fill(Buffer.from([255, 0, 0]))
		const blackBuffer = Buffer.alloc(width * control.pixelSize.height * 3)

		streamDeck
			.fillLcdRegion(control.id, leftEdge, 0, redBuffer, {
				format: 'rgb',
				width: width,
				height: control.pixelSize.height,
			})
			.catch((e) => console.error('Fill failed:', e))

		// clear
		setTimeout(() => {
			streamDeck
				.fillLcdRegion(control.id, leftEdge, 0, blackBuffer, {
					format: 'rgb',
					width: width,
					height: control.pixelSize.height,
				})
				.catch((e) => console.error('Fill failed:', e))
		}, 300)
	}
	streamDeck.on('lcdShortPress', lcdPress)
	streamDeck.on('lcdLongPress', lcdPress)

	streamDeck.on('error', (error) => {
		console.error(error)
	})
})()
