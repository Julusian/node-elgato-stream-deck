import type { StreamDeckProperties } from '../../models/base.js'
import type { StreamDeckInputService } from './interface.js'
import type { StreamDeckEvents } from '../../types.js'
import type { CallbackHook } from '../callback-hook.js'
import type { StreamDeckButtonControlDefinition } from '../../controlDefinition.js'

export class ButtonOnlyInputService implements StreamDeckInputService {
	protected readonly deviceProperties: Readonly<StreamDeckProperties>
	readonly #keyState: boolean[]
	readonly #eventSource: CallbackHook<StreamDeckEvents>
	readonly #hidOffset: number

	constructor(
		deviceProperties: Readonly<StreamDeckProperties>,
		eventSource: CallbackHook<StreamDeckEvents>,
		hidOffset: number,
	) {
		this.deviceProperties = deviceProperties
		this.#eventSource = eventSource
		this.#hidOffset = hidOffset

		const maxButtonIndex = this.deviceProperties.CONTROLS.filter(
			(control): control is StreamDeckButtonControlDefinition => control.type === 'button',
		).map((control) => control.index)
		this.#keyState = new Array<boolean>(Math.max(-1, ...maxButtonIndex) + 1).fill(false)
	}

	handleInput(data: Uint8Array): void {
		const dataOffset = this.deviceProperties.KEY_DATA_OFFSET || 0

		for (const control of this.deviceProperties.CONTROLS) {
			if (control.type !== 'button') continue

			const keyPressed = Boolean(data[dataOffset + control.hidIndex + this.#hidOffset])
			const stateChanged = keyPressed !== this.#keyState[control.index]
			if (stateChanged) {
				this.#keyState[control.index] = keyPressed
				if (keyPressed) {
					this.#eventSource.emit('down', control)
				} else {
					this.#eventSource.emit('up', control)
				}
			}
		}
	}
}
