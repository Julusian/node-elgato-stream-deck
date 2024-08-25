import { StreamDeck, StreamDeckButtonControlDefinition } from '@elgato-stream-deck/webhid'
import { Demo } from './demo.js'

export class ChaseDemo implements Demo {
	private pressed: number[] = []
	private counter = 0
	private interval: number | undefined
	private running: Promise<void> | undefined

	private async drawButtons(device: StreamDeck, canvas: HTMLCanvasElement, c: number): Promise<void> {
		// We probably should reuse this instead of creating it each time.
		const ctx = canvas.getContext('2d')

		const ps: Array<Promise<void>> = []

		const controls = device.CONTROLS.filter(
			(control): control is StreamDeckButtonControlDefinition => control.type === 'button',
		).sort((a, b) => b.index - a.index)

		if (ctx) {
			for (const control of controls) {
				const n = c + control.index
				ctx.save()
				ctx.clearRect(0, 0, canvas.width, canvas.height)
				// Start with a font that's 80% as high as the button. maxWidth
				// is used on the stroke and fill calls below to scale down.
				ctx.font = `${canvas.height * 0.8}px "Arial"`
				ctx.strokeStyle = 'blue'
				ctx.lineWidth = 1
				ctx.strokeText(n.toString(), 8, canvas.height * 0.9, canvas.width * 0.8)
				ctx.fillStyle = 'white'
				ctx.fillText(n.toString(), 8, canvas.height * 0.9, canvas.width * 0.8)

				const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
				ps.push(device.fillKeyBuffer(control.index, Buffer.from(id.data), { format: 'rgba' }))
				ctx.restore()
			}
		}

		await Promise.all(ps)
	}

	public async start(device: StreamDeck): Promise<void> {
		await device.clearPanel()

		this.counter = 0

		const canvas = document.createElement('canvas')
		canvas.width = device.BUTTON_WIDTH_PX
		canvas.height = device.BUTTON_HEIGHT_PX

		await this.drawButtons(device, canvas, this.counter)

		if (!this.interval) {
			const doThing = async () => {
				if (!this.running) {
					this.running = this.drawButtons(device, canvas, ++this.counter)
					await this.running
					this.running = undefined
				}
			}
			this.interval = window.setInterval(() => {
				doThing().catch((e) => console.error(e))
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
	public async keyDown(device: StreamDeck, keyIndex: number): Promise<void> {
		if (this.pressed.indexOf(keyIndex) === -1) {
			this.pressed.push(keyIndex)

			await device.fillKeyColor(keyIndex, 255, 0, 0)
		}
	}
	public async keyUp(device: StreamDeck, keyIndex: number): Promise<void> {
		const index = this.pressed.indexOf(keyIndex)
		if (index !== -1) {
			this.pressed.splice(index, 1)

			await device.clearKey(keyIndex)
		}
	}
}
