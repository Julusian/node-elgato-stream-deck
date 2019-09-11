import { KeyIndex, StreamDeck } from 'elgato-stream-deck-core'

export interface Demo {
	start(device: StreamDeck): void
	stop(device: StreamDeck): void

	keyDown(device: StreamDeck, keyIndex: KeyIndex): void
	keyUp(device: StreamDeck, keyIndex: KeyIndex): void
}
