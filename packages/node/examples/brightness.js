// @ts-check
const { listStreamDecks, openStreamDeck } = require('../dist/index')

;(async () => {
	const devices = await listStreamDecks()
	if (!devices[0]) throw new Error('No device found')

	const streamDeck = await openStreamDeck(devices[0].path)

	// Fill it white so we can see the brightness changes
	const buttonControls = streamDeck.CONTROLS.filter((control) => control.type === 'button')
	for (const control of streamDeck.CONTROLS) {
		if (control.type === 'button' && control.feedbackType !== 'none') {
			streamDeck.fillKeyColor(control.index, 255, 255, 255).catch((e) => console.error('Fill failed:', e))
		} else if (control.type === 'lcd-strip') {
			const buffer = Buffer.alloc(control.pixelSize.width * control.pixelSize.height * 3).fill(
				Buffer.from([255, 255, 255])
			)
			streamDeck.fillLcd(control.id, buffer, { format: 'rgb' }).catch((e) => console.error('Fill lcd failed:', e))
		}
	}

	streamDeck.on('down', (control) => {
		if (control.type !== 'button') return

		const percentage = (100 / (buttonControls.length - 1)) * control.index
		console.log(`Setting brightness to ${percentage.toFixed(2)}%`)
		streamDeck.setBrightness(percentage).catch((e) => console.error('Set brightness failed:', e))
	})

	streamDeck.on('error', (error) => {
		console.error(error)
	})
})()
