import { Demo } from './demo'
import { StreamDeck } from 'elgato-stream-deck-web'

// TODO - sticking keys..
export class FillWhenPressedDemo implements Demo {
	private pressed: number[] = []

	start(device: StreamDeck): void {
		device.clearAllKeys()
	}
	stop(device: StreamDeck): void {
		device.clearAllKeys()
	}
	keyDown(device: StreamDeck, keyIndex: number): void {
		if (this.pressed.indexOf(keyIndex) === -1) {
			this.pressed.push(keyIndex)

			device.fillColor(keyIndex, 255, 0, 0)
		}
	}
	keyUp(device: StreamDeck, keyIndex: number): void {
		const index = this.pressed.indexOf(keyIndex)
		if (index !== -1) {
			this.pressed = this.pressed.splice(index, 1)

			device.clearKey(keyIndex)
		}
	}
}
