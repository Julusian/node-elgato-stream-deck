// @ts-check
const path = require('path')
const sharp = require('sharp')
const { listStreamDecks, openStreamDeck, DeviceModelId } = require('../dist/index')

function generateEncoderColor(value, max) {
	const colors = Buffer.alloc(max * 3)

	for (let i = 0; i < max; i++) {
		const color = i < value ? 255 : 0
		colors[i * 3] = color
		colors[i * 3 + 1] = color
		colors[i * 3 + 2] = color
	}

	return colors
}

;(async () => {
	const devices = await listStreamDecks()
	const studioDevice = devices.find((dev) => dev.model === DeviceModelId.STUDIO)
	if (!studioDevice) throw new Error('No device found')

	const streamDeck = await openStreamDeck(studioDevice.path)
	await streamDeck.clearPanel()

	if (streamDeck.MODEL !== DeviceModelId.STUDIO) throw new Error('This demo only supports the studio')

	streamDeck
		.openChildDevice()
		.then(async (child) => {
			console.log('child device opened', !!child)
			if (!child) return

			console.log('child firmware', await child.getFirmwareVersion())
			console.log('child serial number', await child.getSerialNumber())

			child.clearPanel().catch((e) => console.error('Clear child failed:', e))

			for (const control of child.CONTROLS) {
				if (control.type === 'button') {
					child
						.fillKeyColor(control.index, control.index * 30, 255 - control.index * 30, 0)
						.catch((e) => console.error('fill child failed:', e))
				} else if (control.type === 'lcd-strip') {
					sharp(path.resolve(__dirname, 'fixtures/github_logo.png'))
						.flatten()
						.resize(control.pixelSize.width, control.pixelSize.height)
						.raw()
						.toBuffer()
						.then((img) => {
							return child.fillLcd(control.id, img, { format: 'rgb' })
						})
						.catch((e) => console.error('child lcd fill failed:', e))
				}
			}

			const img = await sharp(path.resolve(__dirname, 'fixtures/github_logo.png'))
				.flatten()
				.resize(child.BUTTON_WIDTH_PX, child.BUTTON_HEIGHT_PX)
				.raw()
				.toBuffer()

			child.on('down', (control) => {
				if (control.type === 'button') {
					// Fill the pressed key with an image of the GitHub logo.
					console.log('Filling child button #%d', control.index)
					if (control.feedbackType === 'lcd') {
						child.fillKeyBuffer(control.index, img).catch((e) => console.error('Fill failed:', e))
					} else {
						child.fillKeyColor(control.index, 255, 255, 255).catch((e) => console.error('Fill failed:', e))
					}
				} else {
					console.log('Filling child encoder #%d', control.index)

					if (control.hasLed) {
						child.setEncoderColor(control.index, 255, 0, 0).catch((e) => console.error('Fill failed:', e))
					}
				}
			})

			child.on('up', (control) => {
				if (control.type === 'button') {
					// Clear the key when it is released.
					console.log('Clearing child button #%d', control.index)
					child.clearKey(control.index).catch((e) => console.error('Clear failed:', e))
				} else {
					console.log('Clearing child encoder #%d', control.index)

					if (control.hasLed) {
						child.setEncoderColor(control.index, 0, 0, 0).catch((e) => console.error('Fill failed:', e))
					}
				}
			})
			child.on('rotate', (control, amount) => {
				console.log('Child encoder rotate #%d (%d)', control.index, amount)
			})

			child.on('lcdShortPress', (control, pos) => {
				console.log('child lcd short press #%d (%d, %d)', control.id, pos.x, pos.y)
			})
			child.on('lcdLongPress', (control, pos) => {
				console.log('child lcd long press #%d (%d, %d)', control.id, pos.x, pos.y)
			})
			child.on('lcdSwipe', (control, from, to) => {
				console.log('child lcd swipe #%d (%d, %d)->(%d, %d)', control.id, from.x, from.y, to.x, to.y)
			})

			child.on('error', (error) => {
				console.error('child error', error)
			})
		})
		.catch((e) => {
			console.error('failed to open child device', e)
		})

	console.log('firmware', await streamDeck.getFirmwareVersion())
	console.log('serial number', await streamDeck.getSerialNumber())

	/** @type {import('@elgato-stream-deck/core').StreamDeckEncoderControlDefinition[]} */
	// @ts-ignore
	const encoders = streamDeck.CONTROLS.filter((control) => control.type === 'encoder')

	const encoderValues = encoders.map((encoder) => Math.round(encoder.ledRingSteps / 2))
	for (const control of encoders) {
		streamDeck
			.setEncoderRingColors(
				control.index,
				generateEncoderColor(encoderValues[control.index], control.ledRingSteps)
			)
			.catch((e) => console.error('Fill failed:', e))
	}

	const img = await sharp(path.resolve(__dirname, 'fixtures/github_logo.png'))
		.flatten()
		.resize(streamDeck.BUTTON_WIDTH_PX, streamDeck.BUTTON_HEIGHT_PX)
		.raw()
		.toBuffer()

	streamDeck.on('nfcRead', (id) => {
		console.log('nfc read', id, id.length)
	})

	streamDeck.on('down', (control) => {
		if (control.type === 'button') {
			// Fill the pressed key with an image of the GitHub logo.
			console.log('Filling button #%d', control.index)
			if (control.feedbackType === 'lcd') {
				streamDeck.fillKeyBuffer(control.index, img).catch((e) => console.error('Fill failed:', e))
			} else {
				streamDeck.fillKeyColor(control.index, 255, 255, 255).catch((e) => console.error('Fill failed:', e))
			}
		} else {
			console.log('Filling encoder #%d', control.index)

			streamDeck.setEncoderColor(control.index, 255, 0, 0).catch((e) => console.error('Fill failed:', e))
		}
	})

	streamDeck.on('up', (control) => {
		if (control.type === 'button') {
			// Clear the key when it is released.
			console.log('Clearing button #%d', control.index)
			streamDeck.clearKey(control.index).catch((e) => console.error('Clear failed:', e))
		} else {
			console.log('Clearing encoder #%d', control.index)

			streamDeck.setEncoderColor(control.index, 0, 0, 0).catch((e) => console.error('Fill failed:', e))
		}
	})

	streamDeck.on('rotate', (control, amount) => {
		console.log('Encoder rotate #%d %d', control.index, amount)

		encoderValues[control.index] = Math.min(
			control.ledRingSteps,
			Math.max(0, encoderValues[control.index] + amount)
		)
		streamDeck
			.setEncoderRingColors(
				control.index,
				generateEncoderColor(encoderValues[control.index], control.ledRingSteps)
			)
			.catch((e) => console.error('Fill failed:', e))
	})

	streamDeck.on('error', (error) => {
		console.error(error)
	})
})()
