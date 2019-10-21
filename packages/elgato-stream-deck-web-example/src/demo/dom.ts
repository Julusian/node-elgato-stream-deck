import { StreamDeckWeb } from 'elgato-stream-deck-web'
import { toCanvas } from 'html-to-image'
import { Demo } from './demo'

function getRandomColor() {
	const letters = '0123456789ABCDEF'
	let color = '#'
	for (let i = 0; i < 6; i++) {
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

	public async start(device: StreamDeckWeb): Promise<void> {
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
						await device.fillPanelCanvas(canvas)
						this.isSending = false
					})
				}
			}, 1000 / 5)
		}
	}
	public async stop(_device: StreamDeckWeb): Promise<void> {
		if (this.element) {
			this.element.style.display = 'none'
		}

		if (this.interval) {
			window.clearInterval(this.interval)
			this.interval = undefined
		}
	}
	public async keyDown(_device: StreamDeckWeb, _keyIndex: number): Promise<void> {
		if (this.element) {
			this.element.style.background = getRandomColor()
		}
	}
	public async keyUp(_device: StreamDeckWeb, _keyIndex: number): Promise<void> {
		// Nothing to do
	}
}
