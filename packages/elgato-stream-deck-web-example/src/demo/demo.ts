import { KeyIndex, StreamDeck } from 'elgato-stream-deck-core'

export interface Demo {
	start(device: StreamDeck): Promise<void>
	stop(device: StreamDeck): Promise<void>

	keyDown(device: StreamDeck, keyIndex: KeyIndex): Promise<void>
	keyUp(device: StreamDeck, keyIndex: KeyIndex): Promise<void>
}
