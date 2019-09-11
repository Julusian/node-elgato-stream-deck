import { Demo } from './demo'
import { StreamDeck } from 'elgato-stream-deck-web'

// TODO - sticking keys..
export class FillWhenPressedDemo implements Demo {
	private pressed: number[] = []

	async start(device: StreamDeck): Promise<void> {
		await device.clearAllKeys()
	}
	async stop(device: StreamDeck): Promise<void> {
		await device.clearAllKeys()
	}
	async keyDown(device: StreamDeck, keyIndex: number): Promise<void> {
		if (this.pressed.indexOf(keyIndex) === -1) {
			this.pressed.push(keyIndex)

			await device.fillColor(keyIndex, 255, 0, 0)
		}
	}
	async keyUp(device: StreamDeck, keyIndex: number): Promise<void> {
		const index = this.pressed.indexOf(keyIndex)
		if (index !== -1) {
			this.pressed = this.pressed.splice(index, 1)

			await device.clearKey(keyIndex)
		}
	}
}
