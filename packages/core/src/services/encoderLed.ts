import type { EncoderIndex } from '../id.js'
import type { StreamDeckControlDefinition, StreamDeckEncoderControlDefinition } from '../controlDefinition.js'
import type { HIDDevice } from '../hid-device.js'

export class EncoderLedService {
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

		const buffer = Buffer.alloc(1024)
		buffer.writeUInt8(0x02, 0)
		buffer.writeUInt8(0x10, 1)
		buffer.writeUInt8(encoder, 2)
		buffer.writeUInt8(red, 3)
		buffer.writeUInt8(green, 4)
		buffer.writeUInt8(blue, 5)
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

		const buffer = Buffer.alloc(1024)
		buffer.fill(Buffer.from([red, green, blue]), 3, 3 + control.ledRingSteps * 3)
		buffer.writeUint8(0x02, 0)
		buffer.writeUint8(0x0f, 1)
		buffer.writeUint8(encoder, 2)

		await this.#device.sendReports([buffer])
	}

	public async setEncoderRingColors(encoder: EncoderIndex, colors: number[] | Buffer | Uint8Array): Promise<void> {
		const control = this.#encoderControls.find((c) => c.index === encoder)
		if (!control) throw new Error(`Invalid encoder index ${encoder}`)

		if (control.ledRingSteps <= 0) throw new Error('Encoder does not have an LED ring')

		if (colors.length !== control.ledRingSteps * 3) throw new Error('Invalid colors length')

		const buffer = Buffer.alloc(1024)
		Buffer.from(colors).copy(buffer, 3, 0, control.ledRingSteps * 3)
		buffer.writeUint8(0x02, 0)
		buffer.writeUint8(0x0f, 1)
		buffer.writeUint8(encoder, 2)

		await this.#device.sendReports([buffer])
	}
}
