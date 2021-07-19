const path = require('path')
const Jimp = require('jimp')
const { openStreamDeck } = require('../dist/index')

console.log('Press keys 0-7 to show the first image, and keys 8-15 to show the second image.')
;(async () => {
	const streamDeck = openStreamDeck()
	streamDeck.clearPanel()

	const bmpImgField = await Jimp.read(path.resolve(__dirname, 'fixtures/sunny_field.png')).then((img) => {
		return img.resize(streamDeck.ICON_SIZE * streamDeck.KEY_COLUMNS, streamDeck.ICON_SIZE * streamDeck.KEY_ROWS)
	})
	const bmpImgMosaic = await Jimp.read(path.resolve(__dirname, '../src/__tests__/fixtures/mosaic.png')).then(
		(img) => {
			return img.resize(streamDeck.ICON_SIZE * streamDeck.KEY_COLUMNS, streamDeck.ICON_SIZE * streamDeck.KEY_ROWS)
		}
	)

	const imgField = bmpImgField.bitmap.data
	const imgMosaic = bmpImgMosaic.bitmap.data

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

		streamDeck.fillPanel(image, { format: 'rgba' })
	})

	streamDeck.on('up', () => {
		if (!filled) {
			return
		}

		// Clear the key when all keys are released.
		if (streamDeck.keyState.every((pressed) => !pressed)) {
			console.log('Clearing all buttons')
			streamDeck.clearPanel()
			filled = false
		}
	})

	streamDeck.on('error', (error) => {
		console.error(error)
	})
})()
