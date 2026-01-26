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

	public async clearAll(): Promise<void> {
		const ps: Array<Promise<void>> = []

		for (const control of this.#encoderControls) {
			if (control.ledRingSteps > 0) ps.push(this.setEncoderRingSingleColor(control.index, 0, 0, 0))
		}

		await Promise.all(ps)
	}

	public async setEncoderColor(encoder: EncoderIndex, _red: number, _green: number, _blue: number): Promise<void> {
		const control = this.#encoderControls.find((c) => c.index === encoder)
		if (!control) throw new Error(`Invalid encoder index ${encoder}`)

		throw new Error('Encoder does not have an LED')
	}

	public async setEncoderRingSingleColor(
		encoder: EncoderIndex,
		red: number,
		green: number,
		blue: number,
	): Promise<void> {
		const control = this.#encoderControls.find((c) => c.index === encoder)
		if (!control) throw new Error(`Invalid encoder index ${encoder}`)

		if (control.ledRingSteps <= 0) throw new Error('Encoder does not have an LED ring')

		// Assume them all the same number of steps
		const offset = (1 - encoder) * control.ledRingSteps

		const ps: Array<Promise<void>> = []
		for (let i = 0; i < control.ledRingSteps; i++) {
			ps.push(this.#sendEncoderPixelColor(offset + i, red, green, blue))
		}
		await Promise.all(ps)
	}

	public async setEncoderRingColors(encoder: EncoderIndex, colors: number[] | Uint8Array): Promise<void> {
		const control = this.#encoderControls.find((c) => c.index === encoder)
		if (!control) throw new Error(`Invalid encoder index ${encoder}`)

		if (control.ledRingSteps <= 0) throw new Error('Encoder does not have an LED ring')

		if (colors.length !== control.ledRingSteps * 3) throw new Error('Invalid colors length')

		let colorsArray: number[] = colors instanceof Uint8Array ? Array.from(colors) : colors

		// If there is an offset, repack the buffer to change the start point
		if (control.lcdRingOffset) {
			const oldColorsArray = colorsArray
			colorsArray = []

			colorsArray.push(...oldColorsArray.slice(control.lcdRingOffset * 3))
			colorsArray.push(...oldColorsArray.slice(0, control.lcdRingOffset * 3))
		}

		// Assume them all the same number of steps
		const offset = (1 - encoder) * control.ledRingSteps

		const ps: Array<Promise<void>> = []
		for (let i = 0; i < control.ledRingSteps; i++) {
			ps.push(
				this.#sendEncoderPixelColor(
					offset + i,
					colorsArray[i * 3],
					colorsArray[i * 3 + 1],
					colorsArray[i * 3 + 2],
				),
			)
		}
		await Promise.all(ps)
	}

	async #sendEncoderPixelColor(index: number, red: number, green: number, blue: number): Promise<void> {
		const buffer = new Uint8Array(6)
		buffer[0] = 0x03
		buffer[1] = 0x24
		buffer[2] = index
		buffer[3] = red
		buffer[4] = green
		buffer[5] = blue
		await this.#device.sendFeatureReport(buffer)
	}
}
