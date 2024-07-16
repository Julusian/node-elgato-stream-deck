import { LcdPosition } from '../types'
import { StreamDeckLcdStripControlDefinition } from '../controlDefinition'
import { SomeEmitEventFn } from '../models/plus'

export class LcdInputService {
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

		const buffer = Buffer.from(data)
		const position: LcdPosition = {
			x: buffer.readUint16LE(5),
			y: buffer.readUint16LE(7),
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
					x: buffer.readUint16LE(9),
					y: buffer.readUint16LE(11),
				}
				this.#emitEvent('lcdSwipe', lcdStripControl, position, positionTo)
				break
			}
		}
	}
}
