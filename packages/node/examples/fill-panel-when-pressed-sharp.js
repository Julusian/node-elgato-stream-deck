const path = require('path')
const sharp = require('sharp')
const { openStreamDeck } = require('../dist/index')

console.log('Press keys 0-7 to show the first image, and keys 8-15 to show the second image.')
;(async () => {
	const streamDeck = await openStreamDeck()
	await streamDeck.clearPanel()

	const imgField = await sharp(path.resolve(__dirname, 'fixtures/sunny_field.png'))
		.flatten()
		.resize(streamDeck.ICON_SIZE * streamDeck.KEY_COLUMNS, streamDeck.ICON_SIZE * streamDeck.KEY_ROWS)
		.raw()
		.toBuffer()
	const imgMosaic = await sharp(path.resolve(__dirname, '../../../fixtures/mosaic.png'))
		.flatten()
		.resize(streamDeck.ICON_SIZE * streamDeck.KEY_COLUMNS, streamDeck.ICON_SIZE * streamDeck.KEY_ROWS)
		.raw()
		.toBuffer()

	let filled = false
	streamDeck.on('down', (keyIndex) => {
		if (filled) {
			return
		}

		filled = true

		let image
		if (keyIndex > streamDeck.NUM_KEYS / 2) {
			console.log('Filling entire panel with an image of a sunny field.')
			image = imgField
		} else {
			console.log('Filling entire panel with a mosaic which will show each key as a different color.')
			image = imgMosaic
		}

		streamDeck.fillPanelBuffer(image).catch((e) => console.error('Fill failed:', e))
	})

	streamDeck.on('up', () => {
		if (!filled) {
			return
		}

		// Clear the key when any key is released.
		console.log('Clearing all buttons')
		streamDeck.clearPanel().catch((e) => console.error('Clear failed:', e))
		filled = false
	})

	streamDeck.on('error', (error) => {
		console.error(error)
	})
})()
