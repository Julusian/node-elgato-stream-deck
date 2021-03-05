import { StreamDeck } from '@elgato-stream-deck/webhid'
import { Demo } from './demo'

export class ChaseDemo implements Demo {
	private pressed: number[] = []
	private counter = 0
	private interval: number | undefined

	private async drawButtons(device: StreamDeck, canvas: HTMLCanvasElement, c: number): Promise<void> {
		// We probably should reuse this instead of creating it each time.
		const ctx = canvas.getContext('2d')

		for (let i = 0; i < device.NUM_KEYS; i++) {
			if (ctx) {
				const n = c + i
				ctx.save()
				ctx.clearRect(0, 0, canvas.width, canvas.height)
				// Start with a font that's 80% as high as the button. maxWidth
				// is used on the stroke and fill calls below to scale down.
				ctx.font = canvas.height * 0.8 + 'px "Arial"'
				ctx.strokeStyle = 'blue'
				ctx.lineWidth = 1
				ctx.strokeText(n.toString(), 8, 60, canvas.width * 0.8)
				ctx.fillStyle = 'white'
				ctx.fillText(n.toString(), 8, 60, canvas.width * 0.8)

				const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
				await device.fillKeyBuffer(i, Buffer.from(id.data), { format: 'rgba' })
				ctx.restore()
			}
		}
	}

	public async start(device: StreamDeck): Promise<void> {
		await device.clearPanel()

		this.counter = 0

		const canvas = document.createElement('canvas')
		canvas.width = device.ICON_SIZE
		canvas.height = device.ICON_SIZE

		await this.drawButtons(device, canvas, this.counter)

		if (!this.interval) {
			let isRunning = false
			this.interval = window.setInterval(async () => {
				if (!isRunning) {
					isRunning = true
					await this.drawButtons(device, canvas, ++this.counter)
					isRunning = false
				}
			}, 1000 / 5)
		}
	}
	public async stop(device: StreamDeck): Promise<void> {
		await device.clearPanel()
		if (this.interval) {
			window.clearInterval(this.interval)
			this.interval = undefined
		}
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
