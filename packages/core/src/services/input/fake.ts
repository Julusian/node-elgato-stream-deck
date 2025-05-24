import type { StreamDeckInputService } from './interface.js'

export class FakeInputService implements StreamDeckInputService {
	handleInput(_data: Uint8Array): void {
		// Noop
	}
}
