import type { EncoderIndex } from '../../id.js'
import type { StreamDeckControlDefinition, StreamDeckEncoderControlDefinition } from '../../controlDefinition.js'
import type { HIDDevice } from '../../hid-device.js'
import type { EncoderLedService } from './interface.js'

export class GalleonK100EncoderLedService implements EncoderLedService {
	readonly #device: HIDDevice
	readonly #encoderControls: Readonly<StreamDeckEncoderControlDefinition[]>

	constructor(device: HIDDevice, allControls: Readonly<StreamDeckControlDefinition[]>) {
		this.#device = device
		this.#encoderControls = allControls.filter(
			(control): control is StreamDeckEncoderControlDefinition => control.type === 'encoder',
		)
	}

	public async clearAll(signal: AbortSignal | null): Promise<boolean> {
		const ps: Array<Promise<boolean>> = []

		for (const control of this.#encoderControls) {
			if (control.ledRingSteps > 0) ps.push(this.setEncoderRingSingleColor(control.index, 0, 0, 0, signal))
		}

		const results = await Promise.all(ps)
		return results.every(Boolean)
	}

	public async setEncoderColor(
		encoder: EncoderIndex,
		_red: number,
		_green: number,
		_blue: number,
		_signal: AbortSignal | null,
	): Promise<boolean> {
		const control = this.#encoderControls.find((c) => c.index === encoder)
		if (!control) throw new Error(`Invalid encoder index ${encoder}`)

		throw new Error('Encoder does not have an LED')
	}

	public async setEncoderRingSingleColor(
		encoder: EncoderIndex,
		red: number,
		green: number,
		blue: number,
		signal: AbortSignal | null,
	): Promise<boolean> {
		const control = this.#encoderControls.find((c) => c.index === encoder)
		if (!control) throw new Error(`Invalid encoder index ${encoder}`)

		if (control.ledRingSteps <= 0) throw new Error('Encoder does not have an LED ring')

		// Assume them all the same number of steps
		const offset = (1 - encoder) * control.ledRingSteps

		const buffers: Uint8Array[] = []
		for (let i = 0; i < control.ledRingSteps; i++) {
			buffers.push(this.#encoderPixelColorBuffer(offset + i, red, green, blue))
		}

		return this.#sendRing(buffers, signal)
	}

	public async setEncoderRingColors(
		encoder: EncoderIndex,
		colors: number[] | Uint8Array,
		signal: AbortSignal | null,
	): Promise<boolean> {
		const control = this.#encoderControls.find((c) => c.index === encoder)
		if (!control) throw new Error(`Invalid encoder index ${encoder}`)

		if (control.ledRingSteps <= 0) throw new Error('Encoder does not have an LED ring')

		if (colors.length !== control.ledRingSteps * 3) throw new Error('Invalid colors length')

		let colorsArray: number[] = colors instanceof Uint8Array ? Array.from(colors) : colors

		// If there is an offset, repack the buffer to change the start point
		if (control.ledRingOffset) {
			const oldColorsArray = colorsArray
			colorsArray = []

			colorsArray.push(...oldColorsArray.slice(control.ledRingOffset * 3))
			colorsArray.push(...oldColorsArray.slice(0, control.ledRingOffset * 3))
		}

		// Assume them all the same number of steps
		const offset = (1 - encoder) * control.ledRingSteps

		const buffers: Uint8Array[] = []
		for (let i = 0; i < control.ledRingSteps; i++) {
			buffers.push(
				this.#encoderPixelColorBuffer(
					offset + i,
					colorsArray[i * 3],
					colorsArray[i * 3 + 1],
					colorsArray[i * 3 + 2],
				),
			)
		}

		return this.#sendRing(buffers, signal)
	}

	/**
	 * Each led of the ring is a separate feature report, so if aborted partway through the ring may be partially written.
	 * In that case this resolves false, as the ring was not fully written
	 */
	async #sendRing(buffers: Uint8Array[], signal: AbortSignal | null): Promise<boolean> {
		const results = await Promise.all(buffers.map(async (buffer) => this.#device.sendFeatureReport(buffer, signal)))
		return results.every(Boolean)
	}

	#encoderPixelColorBuffer(index: number, red: number, green: number, blue: number): Uint8Array {
		const buffer = new Uint8Array(6)
		buffer[0] = 0x03
		buffer[1] = 0x24
		buffer[2] = index
		buffer[3] = red
		buffer[4] = green
		buffer[5] = blue
		return buffer
	}
}
