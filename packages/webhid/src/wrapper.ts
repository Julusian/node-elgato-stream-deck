import { KeyIndex, StreamDeck, StreamDeckProxy } from '@elgato-stream-deck/core'

/**
 * A StreamDeck instance.
 * This is an extended variant of the class, to provide some more web friendly helpers, such as accepting a canvas
 */
export class StreamDeckWeb extends StreamDeckProxy {
	constructor(device: StreamDeck) {
		super(device)
	}

	public async fillKeyCanvas(keyIndex: KeyIndex, canvas: HTMLCanvasElement): Promise<void> {
		this.checkValidKeyIndex(keyIndex)

		const ctx = canvas.getContext('2d')
		if (!ctx) {
			throw new Error('Failed to get canvas context')
		}

		const data = ctx.getImageData(0, 0, this.ICON_SIZE, this.ICON_SIZE)
		return this.device.fillKeyBuffer(keyIndex, Buffer.from(data.data), { format: 'rgba' })
	}

	public async fillPanelCanvas(canvas: HTMLCanvasElement): Promise<void> {
		const ctx = canvas.getContext('2d')
		if (!ctx) {
			throw new Error('Failed to get canvas context')
		}

		const data = ctx.getImageData(0, 0, this.ICON_SIZE * this.KEY_COLUMNS, this.ICON_SIZE * this.KEY_ROWS)
		return this.device.fillPanelBuffer(Buffer.from(data.data), { format: 'rgba' })
	}
}
