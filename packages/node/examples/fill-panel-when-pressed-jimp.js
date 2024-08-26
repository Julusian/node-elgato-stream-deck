// @ts-check
const path = require('path')
const Jimp = require('jimp')
const { listStreamDecks, openStreamDeck } = require('../dist/index')

console.log('Press keys 0-7 to show the first image, and keys 8-15 to show the second image.')
;(async () => {
	const devices = await listStreamDecks()
	if (!devices[0]) throw new Error('No device found')

	const streamDeck = await openStreamDeck(devices[0].path)
	await streamDeck.clearPanel()

	const panelDimensions = streamDeck.calculateFillPanelDimensions()
	if (!panelDimensions) throw new Error("Streamdeck doesn't support fillPanel")

	const bmpImgField = await Jimp.read(path.resolve(__dirname, 'fixtures/sunny_field.png')).then((img) => {
		return img.resize(panelDimensions.width, panelDimensions.height)
	})
	const bmpImgMosaic = await Jimp.read(path.resolve(__dirname, '../../../fixtures/mosaic.png')).then((img) => {
		return img.resize(panelDimensions.width, panelDimensions.height)
	})

	/** @type {import('@elgato-stream-deck/core').StreamDeckLcdStripControlDefinition} */
	// @ts-expect-error  to ignore the | undefined
	const lcdStripControl = streamDeck.CONTROLS.find((control) => control.type === 'lcd-strip' && control.id === 0)

	const buttonCount = streamDeck.CONTROLS.filter((control) => control.type === 'button').length

	const bmpImgFieldLcd = lcdStripControl
		? await Jimp.read(path.resolve(__dirname, 'fixtures/sunny_field.png')).then((img) => {
				return img.resize(lcdStripControl.pixelSize.width, lcdStripControl.pixelSize.height)
			})
		: undefined
	const bmpImgMosaicLcd = lcdStripControl
		? await Jimp.read(path.resolve(__dirname, '../../../fixtures/mosaic.png')).then((img) => {
				return img.resize(lcdStripControl.pixelSize.width, lcdStripControl.pixelSize.height)
			})
		: undefined

	const imgField = bmpImgField.bitmap.data
	const imgMosaic = bmpImgMosaic.bitmap.data
	const imgFieldLcd = bmpImgFieldLcd ? bmpImgFieldLcd.bitmap.data : null
	const imgMosaicLcd = bmpImgMosaicLcd ? bmpImgMosaicLcd.bitmap.data : null

	let filled = false
	streamDeck.on('down', (control) => {
		if (control.type !== 'button') return

		if (filled) return

		filled = true

		let image
		let imageLcd
		/** @type {[number, number, number]} */
		let color
		if (control.index > buttonCount / 2) {
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

		streamDeck.fillPanelBuffer(image, { format: 'rgba' }).catch((e) => console.error('Fill failed:', e))
		if (imageLcd) {
			streamDeck
				.fillLcd(lcdStripControl.id, imageLcd, { format: 'rgba' })
				.catch((e) => console.error('Fill lcd failed:', e))
		}

		for (const control of streamDeck.CONTROLS) {
			if (control.type !== 'button') continue
			if (control.feedbackType !== 'rgb') continue

			streamDeck.fillKeyColor(control.index, ...color).catch((e) => console.error('Set touch colour failed:', e))
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
