import { DEVICE_MODELS, OpenStreamDeckOptions, StreamDeck, VENDOR_ID } from 'elgato-stream-deck-core'
import { WebHIDDevice } from './device'

export { DeviceModelId, StreamDeck } from 'elgato-stream-deck-core'

function encodeJPEG(buffer: Buffer, width: number, height: number): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const canvas = document.createElement('canvas')
		canvas.width = width
		canvas.height = height
		const ctx = canvas.getContext('2d')
		if (ctx) {
			const imageData = ctx.createImageData(width, height)
			imageData.data.set(buffer)
			ctx.putImageData(imageData, 0, 0)

			canvas.toBlob(
				b => {
					if (b) {
						resolve(b)
					} else {
						reject()
					}
				},
				'image/jpeg',
				0.9
			)
		} else {
			reject()
		}
	})
		.then(blob => (blob as any).arrayBuffer() as Promise<ArrayBuffer>)
		.then(buf => Buffer.from(buf))
}

// TODO - typings
export async function requestStreamDeck(options?: OpenStreamDeckOptions): Promise<StreamDeck | null> {
	// TODO - error handling
	return (navigator as any).hid
		.requestDevice({
			filters: [
				{
					vendorId: VENDOR_ID
				}
			]
		})
		.then(async (browserDevice: any) => {
			const model = DEVICE_MODELS.find(m => m.productId === browserDevice.productId)
			if (!model) {
				throw new Error('Stream Deck is of unexpected type.')
			}

			await browserDevice.open()

			options = options || {}
			if (!options.encodeJPEG) {
				options.encodeJPEG = encodeJPEG
			}

			return new model.class(new WebHIDDevice(browserDevice), options || {})
		})
}
