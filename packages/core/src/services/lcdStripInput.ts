import { LcdPosition, type StreamDeckEvents } from '../types.js'
import type { StreamDeckLcdStripControlDefinition } from '../controlDefinition.js'
import { uint8ArrayToDataView } from '../util.js'
import type { CallbackHook } from './callback-hook.js'

export class LcdStripInputService {
	readonly #lcdStripControls: Readonly<StreamDeckLcdStripControlDefinition[]>
	readonly #eventSource: CallbackHook<StreamDeckEvents>

	constructor(
		lcdStripControls: Readonly<StreamDeckLcdStripControlDefinition[]>,
		eventSource: CallbackHook<StreamDeckEvents>,
	) {
		this.#lcdStripControls = lcdStripControls
		this.#eventSource = eventSource
	}

	public handleInput(data: Uint8Array): void {
		// Future: This will need to handle selecting the correct control
		const lcdStripControl = this.#lcdStripControls.find((control) => control.id === 0)
		if (!lcdStripControl) return

		const bufferView = uint8ArrayToDataView(data)
		const position: LcdPosition = {
			x: bufferView.getUint16(5, true),
			y: bufferView.getUint16(7, true),
		}

		switch (data[3]) {
			case 1: // short press
				this.#eventSource.emit('lcdShortPress', lcdStripControl, position)
				break
			case 2: // long press
				this.#eventSource.emit('lcdLongPress', lcdStripControl, position)
				break
			case 3: {
				// swipe
				const positionTo: LcdPosition = {
					x: bufferView.getUint16(9, true),
					y: bufferView.getUint16(11, true),
				}
				this.#eventSource.emit('lcdSwipe', lcdStripControl, position, positionTo)
				break
			}
		}
	}
}
