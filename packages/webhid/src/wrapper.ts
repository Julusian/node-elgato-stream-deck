import type { KeyIndex, StreamDeck, StreamDeckButtonControlDefinition } from '@elgato-stream-deck/core'
import { StreamDeckProxy } from '@elgato-stream-deck/core'
import type { WebHIDDevice } from './hid-device.js'

/**
 * A StreamDeck instance.
 * This is an extended variant of the class, to provide some more web friendly helpers, such as accepting a canvas
 */
export class StreamDeckWeb extends StreamDeckProxy {
	private readonly hid: WebHIDDevice

	constructor(device: StreamDeck, hid: WebHIDDevice) {
		super(device)
		this.hid = hid
	}

	/**
	 * Instruct the browser to close and forget the device. This will revoke the website's permissions to access the device.
	 */
	public async forget(): Promise<void> {
		await this.hid.forget()
	}

	public async fillKeyCanvas(keyIndex: KeyIndex, canvas: HTMLCanvasElement): Promise<void> {
		// this.checkValidKeyIndex(keyIndex)

		const ctx = canvas.getContext('2d')
		if (!ctx) throw new Error('Failed to get canvas context')

		const control = this.CONTROLS.find(
			(control): control is StreamDeckButtonControlDefinition =>
				control.type === 'button' && control.index === keyIndex,
		)
		if (!control || control.feedbackType === 'none') throw new TypeError(`Expected a valid keyIndex`)

		if (control.feedbackType !== 'lcd')
			throw new TypeError(`keyIndex ${control.index} does not support lcd feedback`)

		const data = ctx.getImageData(0, 0, control.pixelSize.width, control.pixelSize.height)
		return this.device.fillKeyBuffer(keyIndex, data.data, { format: 'rgba' })
	}

	public async fillPanelCanvas(canvas: HTMLCanvasElement): Promise<void> {
		const ctx = canvas.getContext('2d')
		if (!ctx) throw new Error('Failed to get canvas context')

		const dimensions = this.device.calculateFillPanelDimensions()
		if (!dimensions) throw new Error('Panel does not support filling')

		const data = ctx.getImageData(0, 0, dimensions.width, dimensions.height)
		return this.device.fillPanelBuffer(data.data, { format: 'rgba' })
	}
}
