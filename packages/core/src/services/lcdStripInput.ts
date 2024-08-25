import { LcdPosition } from '../types.js'
import { StreamDeckLcdStripControlDefinition } from '../controlDefinition.js'
import { SomeEmitEventFn } from '../models/plus.js'
import { uint8ArrayToDataView } from '../util.js'

export class LcdStripInputService {
	readonly #lcdStripControls: Readonly<StreamDeckLcdStripControlDefinition[]>
	readonly #emitEvent: SomeEmitEventFn

	constructor(lcdStripControls: Readonly<StreamDeckLcdStripControlDefinition[]>, emitEvent: SomeEmitEventFn) {
		this.#lcdStripControls = lcdStripControls
		this.#emitEvent = emitEvent
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
				this.#emitEvent('lcdShortPress', lcdStripControl, position)
				break
			case 2: // long press
				this.#emitEvent('lcdLongPress', lcdStripControl, position)
				break
			case 3: {
				// swipe
				const positionTo: LcdPosition = {
					x: bufferView.getUint16(9, true),
					y: bufferView.getUint16(11, true),
				}
				this.#emitEvent('lcdSwipe', lcdStripControl, position, positionTo)
				break
			}
		}
	}
}
