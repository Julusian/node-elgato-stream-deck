import type * as EventEmitter from 'eventemitter3'
import type { StreamDeckEvents } from '../types.js'
import type { StreamDeckControlDefinition, StreamDeckEncoderControlDefinition } from '../controlDefinition.js'

export class EncoderInputService {
	readonly #eventSource: EventEmitter<StreamDeckEvents>
	readonly #encoderControls: Readonly<StreamDeckEncoderControlDefinition[]>
	readonly #encoderState: boolean[]

	constructor(eventSource: EventEmitter<StreamDeckEvents>, allControls: Readonly<StreamDeckControlDefinition[]>) {
		this.#eventSource = eventSource
		this.#encoderControls = allControls.filter(
			(control): control is StreamDeckEncoderControlDefinition => control.type === 'encoder',
		)
		const maxIndex = Math.max(-1, ...this.#encoderControls.map((control) => control.index))
		this.#encoderState = new Array<boolean>(maxIndex + 1).fill(false)
	}

	public handleInput(data: Uint8Array): void {
		switch (data[3]) {
			case 0x00: // press/release
				for (const encoderControl of this.#encoderControls) {
					const keyPressed = Boolean(data[4 + encoderControl.hidIndex])
					const stateChanged = keyPressed !== this.#encoderState[encoderControl.index]
					if (stateChanged) {
						this.#encoderState[encoderControl.index] = keyPressed
						if (keyPressed) {
							this.#eventSource.emit('down', encoderControl)
						} else {
							this.#eventSource.emit('up', encoderControl)
						}
					}
				}
				break
			case 0x01: // rotate
				for (const encoderControl of this.#encoderControls) {
					const intArray = new Int8Array(data.buffer, data.byteOffset, data.byteLength)
					const value = intArray[4 + encoderControl.hidIndex]
					if (value !== 0) {
						this.#eventSource.emit('rotate', encoderControl, value)
					}
				}
				break
		}
	}
}
