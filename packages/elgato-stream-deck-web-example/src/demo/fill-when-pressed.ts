import { StreamDeck } from 'elgato-stream-deck-web'
import { Demo } from './demo'

export class FillWhenPressedDemo implements Demo {
	private pressed: number[] = []

	public async start(device: StreamDeck): Promise<void> {
		await device.clearAllKeys()
	}
	public async stop(device: StreamDeck): Promise<void> {
		await device.clearAllKeys()
	}
	public async keyDown(device: StreamDeck, keyIndex: number): Promise<void> {
		if (this.pressed.indexOf(keyIndex) === -1) {
			this.pressed.push(keyIndex)

			await device.fillColor(keyIndex, 255, 0, 0)
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
