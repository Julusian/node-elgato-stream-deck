const sharp = require('sharp')
const path = require('path')
const { openStreamDeck } = require('../dist/index')

openStreamDeck().then((streamDeck) => {
	streamDeck.clearPanel()

	streamDeck.on('down', async (keyIndex) => {
		console.log('Filling button #%d', keyIndex)

		try {
			const finalBuffer = await sharp(
				path.resolve(__dirname, `fixtures/github_logo_${streamDeck.BUTTON_WIDTH_PX}.jpg`)
			)
				.composite([
					{
						input: Buffer.from(
							`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${streamDeck.BUTTON_WIDTH_PX} ${
								streamDeck.BUTTON_HEIGHT_PX
							}" version="1.1">
                        <text
                            font-family="'sans-serif'"
                            font-size="14px"
							font-weight="bold"
                            x="${streamDeck.BUTTON_WIDTH_PX / 2}"
                            y="${streamDeck.BUTTON_HEIGHT_PX - 10}"
                            fill="#fff"
                            text-anchor="middle"
							stroke="#666"
                            >FOO #${keyIndex}</text>
                    </svg>`
						),
						top: 0,
						left: 0,
					},
				])
				.flatten()
				.raw()
				.toBuffer()
			await streamDeck.fillKeyBuffer(keyIndex, finalBuffer, { format: 'rgba' })
		} catch (error) {
			console.error(error)
		}
	})

	streamDeck.on('up', (keyIndex) => {
		// Clear the key when it is released.
		console.log('Clearing button #%d', keyIndex)
		streamDeck.clearKey(keyIndex).catch((e) => console.error('Clear failed:', e))
	})

	streamDeck.on('error', (error) => {
		console.error(error)
	})
})
