import { Demo } from './demo'
import { toCanvas } from 'html-to-image'
import { StreamDeck } from 'elgato-stream-deck-web'

function dropAlpha(rawBuffer: Uint8ClampedArray): Buffer {
	const pixels = rawBuffer.length / 4
	const res = Buffer.alloc(pixels * 3)
	for (let i = 0; i < pixels; i++) {
		const o = i * 4
		const p = i * 3

		res[p] = rawBuffer[o]
		res[p + 1] = rawBuffer[o + 1]
		res[p + 2] = rawBuffer[o + 2]
		res[p + 3] = rawBuffer[o + 3]
	}

	return res
}

function getRandomColor() {
	var letters = '0123456789ABCDEF'
	var color = '#'
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)]
	}
	return color
}

/**
 * This demo is using html-to-image to render a div to the streamdeck.
 * Performance is not great, and the conversion library has many issues with rendering in
 * various cases, but if the source material is very controlled it could be useful.
 * It would be better to render natively on a canvas.
 */
export class DomImageDemo implements Demo {
	private interval: number | undefined

	private element: HTMLElement | undefined
	private isSending = false

	public async start(device: StreamDeck): Promise<void> {
		this.element = document.querySelector<HTMLElement>('#image-source') || undefined
		if (this.element) {
			this.element.style.display = 'block'
		}

		if (!this.interval) {
			this.interval = window.setInterval(() => {
				if (this.element && !this.isSending) {
					const elm = this.element

					this.isSending = true
					toCanvas(elm).then(async canvas => {
						const ctx = canvas.getContext('2d')
						if (ctx) {
							const data = ctx.getImageData(
								0,
								0,
								device.KEY_COLUMNS * device.ICON_SIZE,
								device.KEY_ROWS * device.ICON_SIZE
							)
							await device.fillPanel(dropAlpha(data.data))
							this.isSending = false
						}
					})
				}
			}, 1000 / 5)
		}
	}
	public async stop(_device: StreamDeck): Promise<void> {
		if (this.element) {
			this.element.style.display = 'none'
		}

		if (this.interval) {
			window.clearInterval(this.interval)
			this.interval = undefined
		}
	}
	public async keyDown(_device: StreamDeck, _keyIndex: number): Promise<void> {
		if (this.element) {
			this.element.style.background = getRandomColor()
		}
	}
	public async keyUp(_device: StreamDeck, _keyIndex: number): Promise<void> {}
}
