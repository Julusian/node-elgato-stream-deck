import { HIDDevice } from '../device'
import { OpenStreamDeckOptions, StreamDeckProperties } from './base'
import { StreamDeckGen2Base } from './base-gen2'
import { DeviceModelId } from './id'

const plusProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.PLUS,
	PRODUCT_NAME: 'Streamdeck +',
	COLUMNS: 4,
	ROWS: 2,
	ICON_SIZE: 120,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 3,
}

export class StreamDeckPlus extends StreamDeckGen2Base {
	readonly #encoderState: boolean[]

	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, plusProperties, true)

		this.#encoderState = new Array<boolean>(4).fill(false)
	}

	public get NUM_ENCODERS(): number {
		return 4
	}

	protected handleInputBuffer(data: Uint8Array): void {
		const inputType = data[0]
		switch (inputType) {
			case 0x00: // Button
				super.handleInputBuffer(data)
				break
			case 0x02: // LCD
				console.log(data)
				// TODO
				break
			case 0x03: // Encoder
				console.log(data)
				switch (data[3]) {
					case 0x00: // press/release
						for (let keyIndex = 0; keyIndex < this.NUM_ENCODERS; keyIndex++) {
							const keyPressed = Boolean(data[4 + keyIndex])
							const stateChanged = keyPressed !== this.#encoderState[keyIndex]
							if (stateChanged) {
								this.#encoderState[keyIndex] = keyPressed
								if (keyPressed) {
									this.emit('encoderDown', keyIndex)
								} else {
									this.emit('encoderUp', keyIndex)
								}
							}
						}
						break
					case 0x01: // rotate
						for (let keyIndex = 0; keyIndex < this.NUM_ENCODERS; keyIndex++) {
							switch (data[4 + keyIndex]) {
								case 0x01: // Right
									this.emit('rotateRight', keyIndex)
									break
								case 0xff: // Left
									this.emit('rotateLeft', keyIndex)
									break
							}
						}
						break
				}
				// TODO
				break
		}
	}
}
