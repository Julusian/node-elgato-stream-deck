// @ts-check
const sharp = require('sharp')
const path = require('path')
const { listStreamDecks, openStreamDeck } = require('../dist/index')

;(async () => {
	const devices = await listStreamDecks()
	if (!devices[0]) throw new Error('No device found')

	const streamDeck = await openStreamDeck(devices[0].path)
	await streamDeck.clearPanel()

	const firstButton = streamDeck.CONTROLS.find(
		(control) => control.type === 'button' && control.feedbackType === 'lcd',
	)
	if (!firstButton) throw new Error('No LCD button found')
	const buttonWidth = firstButton.pixelSize.width
	const buttonHeight = firstButton.pixelSize.height

	streamDeck.on('down', async (control) => {
		if (control.type !== 'button') return

		console.log('Filling button #%d', control.index)

		try {
			const finalBuffer = await sharp(path.resolve(__dirname, `fixtures/github_logo_${buttonWidth}.jpg`))
				.composite([
					{
						input: Buffer.from(
							`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${buttonWidth} ${buttonHeight}" version="1.1">
                        <text
                            font-family="'sans-serif'"
                            font-size="14px"
								font-weight="bold"
                            x="${buttonWidth / 2}"
                            y="${buttonHeight - 10}"
                            fill="#fff"
                            text-anchor="middle"
							stroke="#666"
                            >FOO #${control.index}</text>
                    </svg>`,
						),
						top: 0,
						left: 0,
					},
				])
				.flatten()
				.raw()
				.toBuffer()
			await streamDeck.fillKeyBuffer(control.index, finalBuffer, { format: 'rgba' })
		} catch (error) {
			console.error(error)
		}
	})

	streamDeck.on('up', (control) => {
		// Clear the key when it is released.
		console.log('Clearing button #%d', control.index)
		streamDeck.clearKey(control.index).catch((e) => console.error('Clear failed:', e))
	})

	streamDeck.on('error', (error) => {
		console.error(error)
	})
})()
