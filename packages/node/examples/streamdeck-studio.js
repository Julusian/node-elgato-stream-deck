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

	console.log('firmware', await streamDeck.getFirmwareVersion())
	console.log('serial number', await streamDeck.getSerialNumber())
	console.log('all-firmware', await streamDeck.getAllFirmwareVersions())

	/** @type {import('@elgato-stream-deck/core').StreamDeckEncoderControlDefinition[]} */
	const encoders = streamDeck.CONTROLS.filter((control) => control.type === 'encoder')

	const encoderValues = encoders.map((encoder) => Math.round(encoder.ledRingSteps / 2))
	for (const control of encoders) {
		streamDeck
			.setEncoderRingColors(
				control.index,
				generateEncoderColor(encoderValues[control.index], control.ledRingSteps),
			)
			.catch((e) => console.error('Fill failed:', e))
	}

	const firstButton = streamDeck.CONTROLS.find((control) => control.type === 'button')
	const img = await sharp(path.resolve(__dirname, 'fixtures/github_logo.png'))
		.flatten()
		.resize(firstButton.pixelSize.width, firstButton.pixelSize.height)
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
			Math.max(0, encoderValues[control.index] + amount),
		)
		streamDeck
			.setEncoderRingColors(
				control.index,
				generateEncoderColor(encoderValues[control.index], control.ledRingSteps),
			)
			.catch((e) => console.error('Fill failed:', e))
	})

	streamDeck.on('error', (error) => {
		console.error(error)
	})
})()
