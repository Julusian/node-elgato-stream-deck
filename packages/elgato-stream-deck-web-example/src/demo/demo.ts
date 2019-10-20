import { KeyIndex, StreamDeckWeb } from 'elgato-stream-deck-web'

export interface Demo {
	start(device: StreamDeckWeb): Promise<void>
	stop(device: StreamDeckWeb): Promise<void>

	keyDown(device: StreamDeckWeb, keyIndex: KeyIndex): Promise<void>
	keyUp(device: StreamDeckWeb, keyIndex: KeyIndex): Promise<void>
}
