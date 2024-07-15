import type { EventEmitter } from 'events'
import type { StreamDeckEvents } from '..'

export class EncoderInputService {
	readonly #eventSource: EventEmitter<StreamDeckEvents>
	readonly #encoderCount: number
	readonly #encoderState: boolean[]

	constructor(eventSource: EventEmitter<StreamDeckEvents>, encoderCount: number) {
		this.#eventSource = eventSource
		this.#encoderCount = encoderCount
		this.#encoderState = new Array<boolean>(encoderCount).fill(false)
	}

	public handleInput(data: Uint8Array): void {
		switch (data[3]) {
			case 0x00: // press/release
				for (let keyIndex = 0; keyIndex < this.#encoderCount; keyIndex++) {
					const keyPressed = Boolean(data[4 + keyIndex])
					const stateChanged = keyPressed !== this.#encoderState[keyIndex]
					if (stateChanged) {
						this.#encoderState[keyIndex] = keyPressed
						if (keyPressed) {
							this.#eventSource.emit('encoderDown', keyIndex)
						} else {
							this.#eventSource.emit('encoderUp', keyIndex)
						}
					}
				}
				break
			case 0x01: // rotate
				for (let keyIndex = 0; keyIndex < this.#encoderCount; keyIndex++) {
					const intArray = new Int8Array(data.buffer, data.byteOffset, data.byteLength)
					const value = intArray[4 + keyIndex]
					if (value > 0) {
						this.#eventSource.emit('rotateRight', keyIndex, value)
					} else if (value < 0) {
						this.#eventSource.emit('rotateLeft', keyIndex, -value)
					}
				}
				break
		}
	}
}
