import type { EncoderIndex } from '../../id.js'
import type { StreamDeckControlDefinition, StreamDeckEncoderControlDefinition } from '../../controlDefinition.js'
import type { HIDDevice } from '../../hid-device.js'
import type { EncoderLedService } from './interface.js'

export class StudioEncoderLedService implements EncoderLedService {
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
			if (control.hasLed) ps.push(this.setEncoderColor(control.index, 0, 0, 0))
			if (control.ledRingSteps > 0) ps.push(this.setEncoderRingSingleColor(control.index, 0, 0, 0))
		}

		await Promise.all(ps)
	}

	public async setEncoderColor(encoder: EncoderIndex, red: number, green: number, blue: number): Promise<void> {
		const control = this.#encoderControls.find((c) => c.index === encoder)
		if (!control) throw new Error(`Invalid encoder index ${encoder}`)

		if (!control.hasLed) throw new Error('Encoder does not have an LED')

		const buffer = new Uint8Array(1024)
		buffer[0] = 0x02
		buffer[1] = 0x10
		buffer[2] = encoder
		buffer[3] = red
		buffer[4] = green
		buffer[5] = blue
		await this.#device.sendReports([buffer])
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

		const buffer = new Uint8Array(1024)
		buffer[0] = 0x02
		buffer[1] = 0x0f
		buffer[2] = encoder
		for (let i = 0; i < control.ledRingSteps; i++) {
			const offset = 3 + i * 3
			buffer[offset] = red
			buffer[offset + 1] = green
			buffer[offset + 2] = blue
		}

		await this.#device.sendReports([buffer])
	}

	public async setEncoderRingColors(encoder: EncoderIndex, colors: number[] | Uint8Array): Promise<void> {
		const control = this.#encoderControls.find((c) => c.index === encoder)
		if (!control) throw new Error(`Invalid encoder index ${encoder}`)

		if (control.ledRingSteps <= 0) throw new Error('Encoder does not have an LED ring')

		if (colors.length !== control.ledRingSteps * 3) throw new Error('Invalid colors length')

		let colorsBuffer = colors instanceof Uint8Array ? colors : new Uint8Array(colors)

		// If there is an offset, repack the buffer to change the start point
		if (control.lcdRingOffset) {
			const oldColorsBuffer = colorsBuffer
			colorsBuffer = new Uint8Array(oldColorsBuffer.length)

			colorsBuffer.set(oldColorsBuffer.slice(control.lcdRingOffset * 3), 0)
			colorsBuffer.set(oldColorsBuffer.slice(0, control.lcdRingOffset * 3), control.lcdRingOffset * 3)
		}

		const buffer = new Uint8Array(1024)
		buffer[0] = 0x02
		buffer[1] = 0x0f
		buffer[2] = encoder
		buffer.set(colorsBuffer, 3)

		await this.#device.sendReports([buffer])
	}
}
