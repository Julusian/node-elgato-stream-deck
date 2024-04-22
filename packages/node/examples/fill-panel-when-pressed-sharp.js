const path = require('path')
const sharp = require('sharp')
const { listStreamDecks, openStreamDeck } = require('../dist/index')

console.log('Press keys 0-7 to show the first image, and keys 8-15 to show the second image.')
;(async () => {
	const devices = await listStreamDecks()
	if (!devices[0]) throw new Error('No device found')

	const streamDeck = await openStreamDeck(devices[0].path)
	await streamDeck.clearPanel()

	streamDeck.getSerialNumber().then((ser) => {
		console.log('serial', ser)
	})
	streamDeck.getFirmwareVersion().then((ser) => {
		console.log('firmware', ser)
	})

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

	const imgFieldLcd = streamDeck.LCD_STRIP_SIZE
		? await sharp(path.resolve(__dirname, 'fixtures/sunny_field.png'))
				.flatten()
				.resize(streamDeck.LCD_STRIP_SIZE.width, streamDeck.LCD_STRIP_SIZE.height)
				.raw()
				.toBuffer()
		: undefined
	const imgMosaicLcd = streamDeck.LCD_STRIP_SIZE
		? await sharp(path.resolve(__dirname, '../../../fixtures/mosaic.png'))
				.flatten()
				.resize(streamDeck.LCD_STRIP_SIZE.width, streamDeck.LCD_STRIP_SIZE.height)
				.raw()
				.toBuffer()
		: undefined

	let filled = false
	streamDeck.on('down', (keyIndex) => {
		if (filled) {
			return
		}

		filled = true

		let image
		let imageLcd
		let color
		if (keyIndex > streamDeck.NUM_KEYS / 2) {
			console.log('Filling entire panel with an image of a sunny field.')
			image = imgField
			imageLcd = imgFieldLcd
			color = [0, 255, 0]
		} else {
			console.log('Filling entire panel with a mosaic which will show each key as a different color.')
			image = imgMosaic
			imageLcd = imgMosaicLcd
			color = [255, 0, 255]
		}

		streamDeck.fillPanelBuffer(image).catch((e) => console.error('Fill failed:', e))
		if (imageLcd) {
			streamDeck.fillLcd(imageLcd, { format: 'rgb' }).catch((e) => console.error('Fill lcd failed:', e))
		}
		if (streamDeck.NUM_TOUCH_KEYS) {
			for (let index = 0; index < streamDeck.NUM_TOUCH_KEYS; index++) {
				streamDeck
					.fillKeyColor(index + streamDeck.NUM_KEYS, ...color)
					.catch((e) => console.error('Set touch colour failed:', e))
			}
		}
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
