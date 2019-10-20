import { StreamDeck } from 'elgato-stream-deck-web'
import { Demo } from './demo'

function getRandomIntInclusive(min: number, max: number) {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1)) + min
}

export class RapidFillDemo implements Demo {
	private interval: number | undefined

	public async start(device: StreamDeck): Promise<void> {
		if (!this.interval) {
			this.interval = window.setInterval(() => {
				const r = getRandomIntInclusive(0, 255)
				const g = getRandomIntInclusive(0, 255)
				const b = getRandomIntInclusive(0, 255)
				console.log('Filling with rgb(%d, %d, %d)', r, g, b)
				for (let i = 0; i < device.NUM_KEYS; i++) {
					device.fillKeyColor(i, r, g, b)
				}
			}, 1000 / 5)
		}
	}
	public async stop(_device: StreamDeck): Promise<void> {
		if (this.interval) {
			window.clearInterval(this.interval)
			this.interval = undefined
		}
	}
	public async keyDown(_device: StreamDeck, _keyIndex: number): Promise<void> {
		// Nothing to do
	}
	public async keyUp(_device: StreamDeck, _keyIndex: number): Promise<void> {
		// Nothing to do
	}
}
