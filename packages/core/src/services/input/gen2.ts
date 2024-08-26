import type { StreamDeckProperties } from '../../models/base.js'
import type { LcdPosition, StreamDeckEvents } from '../../types.js'
import type { CallbackHook } from '../callback-hook.js'
import type {
	StreamDeckEncoderControlDefinition,
	StreamDeckLcdSegmentControlDefinition,
} from '../../controlDefinition.js'
import { ButtonOnlyInputService } from './gen1.js'
import { uint8ArrayToDataView } from '../../util.js'

export class Gen2InputService extends ButtonOnlyInputService {
	readonly #eventSource: CallbackHook<StreamDeckEvents>
	readonly #encoderControls: Readonly<StreamDeckEncoderControlDefinition[]>
	readonly #encoderState: boolean[]
	readonly #lcdSegmentControls: Readonly<StreamDeckLcdSegmentControlDefinition[]>

	constructor(deviceProperties: Readonly<StreamDeckProperties>, eventSource: CallbackHook<StreamDeckEvents>) {
		super(deviceProperties, eventSource)

		this.#eventSource = eventSource
		this.#encoderControls = deviceProperties.CONTROLS.filter(
			(control): control is StreamDeckEncoderControlDefinition => control.type === 'encoder',
		)
		const maxIndex = Math.max(-1, ...this.#encoderControls.map((control) => control.index))
		this.#encoderState = new Array<boolean>(maxIndex + 1).fill(false)

		this.#lcdSegmentControls = deviceProperties.CONTROLS.filter(
			(control): control is StreamDeckLcdSegmentControlDefinition => control.type === 'lcd-segment',
		)
	}

	handleInput(data: Uint8Array): void {
		const inputType = data[0]
		switch (inputType) {
			case 0x00: // Button
				super.handleInput(data)
				break
			case 0x02: // LCD
				this.#handleLcdSegmentInput(data)
				break
			case 0x03: // Encoder
				this.#handleEncoderInput(data)
				break
		}
	}

	#handleLcdSegmentInput(data: Uint8Array): void {
		// Future: This will need to handle selecting the correct control
		const lcdSegmentControl = this.#lcdSegmentControls.find((control) => control.id === 0)
		if (!lcdSegmentControl) return

		const bufferView = uint8ArrayToDataView(data)
		const position: LcdPosition = {
			x: bufferView.getUint16(5, true),
			y: bufferView.getUint16(7, true),
		}

		switch (data[3]) {
			case 1: // short press
				this.#eventSource.emit('lcdShortPress', lcdSegmentControl, position)
				break
			case 2: // long press
				this.#eventSource.emit('lcdLongPress', lcdSegmentControl, position)
				break
			case 3: {
				// swipe
				const positionTo: LcdPosition = {
					x: bufferView.getUint16(9, true),
					y: bufferView.getUint16(11, true),
				}
				this.#eventSource.emit('lcdSwipe', lcdSegmentControl, position, positionTo)
				break
			}
		}
	}

	#handleEncoderInput(data: Uint8Array): void {
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
