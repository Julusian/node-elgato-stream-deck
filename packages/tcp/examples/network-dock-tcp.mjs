// @ts-check
import path from 'path'
import sharp from 'sharp'
import { StreamDeckTcpConnectionManager } from '../dist/index.js'

// Parse command line arguments
const args = process.argv.slice(2)
const ipAddress = args[0]

if (!ipAddress) {
	console.error('Error: IP address is required')
	console.log('')
	console.log('Usage: node network-dock-tcp.mjs <ip-address>')
	console.log('')
	console.log('Examples:')
	console.log('  node network-dock-tcp.mjs 192.168.1.100')
	console.log('  node network-dock-tcp.mjs 10.42.13.180')
	console.log('')
	console.log('Description:')
	console.log('  Connects to an Elgato Stream Deck via TCP at the specified IP address.')
	process.exit(1)
}

const connectionManager = new StreamDeckTcpConnectionManager()

connectionManager.connectTo(ipAddress)

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

	// streamDeck
	// 	.getAllFirmwareVersions()
	// 	.then((versions) => {
	// 		console.log('all versions', versions)
	// 	})
	// 	.catch((e) => console.log('all versions failed', e))

	streamDeck
		.getSerialNumber()
		.then((serial) => console.log('serial', serial))
		.catch((e) => console.log('serial failed', e))

	// // streamDeck
	// // 	.getFirmwareVersion()
	// // 	.then((version) => console.log('firmware', version))
	// // 	.catch((e) => console.log('firmware failed', e))

	// streamDeck
	// 	.getMacAddress()
	// 	.then((version) => console.log('mac address', version))
	// 	.catch((e) => console.log('mac address failed', e))

	// streamDeck
	// 	.getHidDeviceInfo()
	// 	.then((info) => console.log('hid info', info))
	// 	.catch((e) => console.log('hid info failed', e))

	streamDeck
		.getChildDeviceInfo()
		.then((info) => console.log('child info', info))
		.catch((e) => console.log('child info failed', e))

	if (streamDeck.CONTROLS.length === 0) {
		// Network dock, skip the rest.
		return
	}

	let brightness = 15
	setInterval(() => {
		brightness = (brightness + 10) % 100
		streamDeck
			.setBrightness(brightness)
			.then(() => {
				console.log(`Brightness set to ${brightness}%`)
			})
			.catch((e) => console.error('set brightness failed:', e))
	}, 1000)

	streamDeck.clearPanel().catch((e) => console.error('clear panel failed:', e))

	// /** @type {import('@elgato-stream-deck/core').StreamDeckEncoderControlDefinition[]} */
	// const encoders = streamDeck.CONTROLS.filter((control) => control.type === 'encoder')

	// const encoderValues = encoders.map((encoder) => Math.round(encoder.ledRingSteps / 2))

	// for (const control of encoders) {
	// 	if (control.ledRingSteps > 0) {
	// 		streamDeck
	// 			.setEncoderRingColors(
	// 				control.index,
	// 				generateEncoderColor(encoderValues[control.index], control.ledRingSteps),
	// 			)
	// 			.catch((e) => console.error('Fill failed:', e))
	// 	}
	// }

	// // setTimeout(() => {
	// // 	streamDeck.resetToLogo()
	// // }, 2000)

	// streamDeck.on('disconnected', () => {
	// 	console.log('disconnected!')
	// })

	const firstButton = streamDeck.CONTROLS.find((control) => control.type === 'button')
	const img = await sharp(path.resolve('fixtures/github_logo.png'))
		.flatten()
		.resize(firstButton.pixelSize.width, firstButton.pixelSize.height)
		.raw()
		.toBuffer()

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
	// streamDeck.on('rotate', (control, amount) => {
	// 	console.log('rotate', control, amount)

	// 	encoderValues[control.index] = Math.min(
	// 		control.ledRingSteps,
	// 		Math.max(0, encoderValues[control.index] + amount),
	// 	)

	// 	if (control.ledRingSteps > 0) {
	// 		streamDeck
	// 			.setEncoderRingColors(
	// 				control.index,
	// 				generateEncoderColor(encoderValues[control.index], control.ledRingSteps),
	// 			)
	// 			.catch((e) => console.error('Fill failed:', e))
	// 	}
	// })
	// streamDeck.on('nfcRead', (id) => console.log('nfc read', id))
})
