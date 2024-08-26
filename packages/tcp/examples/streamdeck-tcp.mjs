// @ts-check
import path from 'path'
import sharp from 'sharp'
import { StreamDeckTcpConnectionManager } from '../dist/index.js'

const connectionManager = new StreamDeckTcpConnectionManager()

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

connectionManager.connectTo('10.42.13.166')

connectionManager.on('error', (err) => {
	console.log('error', err)
})

connectionManager.on('connected', async (streamDeck) => {
	streamDeck.tcpEvents.on('disconnected', () => {
		console.log('disconnect')
	})
	streamDeck.on('error', (err) => {
		console.log('sd error', err)
	})
	console.log('connected!')

	const img = await sharp(path.resolve('fixtures/github_logo.png'))
		.flatten()
		.resize(streamDeck.BUTTON_WIDTH_PX, streamDeck.BUTTON_HEIGHT_PX)
		.raw()
		.toBuffer()

	const fullSize = streamDeck.calculateFillPanelDimensions()
	const fullImg =
		fullSize &&
		(await sharp(path.resolve('fixtures/github_logo.png'))
			.flatten()
			.resize(fullSize.width, fullSize.height, { fit: 'fill' })
			.raw()
			.toBuffer())

	if (fullImg) {
		console.log('send fill')
		streamDeck.fillPanelBuffer(fullImg).catch((e) => console.log('fullImg failed', e))

		console.log('post send fill')
	}

	streamDeck
		.setBrightness(80)
		.then(() => console.log('brightness ok'))
		.catch((e) => console.log('brightness  failed', e))

	streamDeck
		.getSerialNumber()
		.then((serial) => console.log('serial', serial))
		.catch((e) => console.log('serial failed', e))

	streamDeck
		.getFirmwareVersion()
		.then((version) => console.log('firmware', version))
		.catch((e) => console.log('firmware failed', e))

	streamDeck
		.getMacAddress()
		.then((version) => console.log('mac address', version))
		.catch((e) => console.log('mac address failed', e))

	streamDeck
		.getHidDeviceInfo()
		.then((info) => console.log('hid info', info))
		.catch((e) => console.log('hid info failed', e))

	streamDeck.clearPanel().catch((e) => console.log('clear faild', e))

	streamDeck
		.getChildDeviceInfo()
		.then((info) => console.log('child info', info))
		.catch((e) => console.log('child info failed', e))

	/** @type {import('@elgato-stream-deck/core').StreamDeckEncoderControlDefinition[]} */
	// @ts-ignore
	const encoders = streamDeck.CONTROLS.filter((control) => control.type === 'encoder')

	const encoderValues = encoders.map((encoder) => Math.round(encoder.ledRingSteps / 2))

	for (const control of encoders) {
		if (control.ledRingSteps > 0) {
			streamDeck
				.setEncoderRingColors(
					control.index,
					generateEncoderColor(encoderValues[control.index], control.ledRingSteps)
				)
				.catch((e) => console.error('Fill failed:', e))
		}
	}

	// setTimeout(() => {
	// 	streamDeck.resetToLogo()
	// }, 2000)

	streamDeck.on('disconnected', () => {
		console.log('disconnected!')
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
		} else if (control.hasLed) {
			console.log('Filling encoder #%d', control.index)

			streamDeck.setEncoderColor(control.index, 255, 0, 0).catch((e) => console.error('Fill failed:', e))
		}
	})
	streamDeck.on('up', (control) => {
		if (control.type === 'button') {
			// Clear the key when it is released.
			console.log('Clearing button #%d', control.index)
			streamDeck.clearKey(control.index).catch((e) => console.error('Clear failed:', e))
		} else if (control.hasLed) {
			console.log('Clearing encoder #%d', control.index)

			streamDeck.setEncoderColor(control.index, 0, 0, 0).catch((e) => console.error('Fill failed:', e))
		}
	})
	streamDeck.on('rotate', (control, amount) => {
		console.log('rotate', control, amount)

		encoderValues[control.index] = Math.min(
			control.ledRingSteps,
			Math.max(0, encoderValues[control.index] + amount)
		)

		if (control.ledRingSteps > 0) {
			streamDeck
				.setEncoderRingColors(
					control.index,
					generateEncoderColor(encoderValues[control.index], control.ledRingSteps)
				)
				.catch((e) => console.error('Fill failed:', e))
		}
	})
	streamDeck.on('nfcRead', (id) => console.log('nfc read', id))
})
