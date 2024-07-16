import { StreamDeck } from '@elgato-stream-deck/webhid'
import { Demo } from './demo'

function getRandomIntInclusive(min: number, max: number) {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1)) + min
}

export class RapidFillDemo implements Demo {
	private interval: number | undefined
	private running: Promise<void[]> | undefined

	public async start(device: StreamDeck): Promise<void> {
		if (!this.interval) {
			const doThing = async () => {
				if (!this.running) {
					const r = getRandomIntInclusive(0, 255)
					const g = getRandomIntInclusive(0, 255)
					const b = getRandomIntInclusive(0, 255)
					console.log('Filling with rgb(%d, %d, %d)', r, g, b)

					const ps: Array<Promise<void>> = []
					for (const control of device.CONTROLS) {
						if (control.type === 'button') {
							ps.push(device.fillKeyColor(control.index, r, g, b))
						}
					}

					this.running = Promise.all(ps)
					await this.running
					this.running = undefined
				}
			}
			this.interval = window.setInterval(() => {
				doThing().catch((e) => console.log(e))
			}, 1000 / 5)
		}
	}
	public async stop(device: StreamDeck): Promise<void> {
		if (this.interval) {
			window.clearInterval(this.interval)
			this.interval = undefined
		}
		await this.running
		await device.clearPanel()
	}
	public async keyDown(_device: StreamDeck, _keyIndex: number): Promise<void> {
		// Nothing to do
	}
	public async keyUp(_device: StreamDeck, _keyIndex: number): Promise<void> {
		// Nothing to do
	}
}
