import { DEVICE_MODELS, OpenStreamDeckOptions, StreamDeck, VENDOR_ID } from 'elgato-stream-deck-core'
import { WebHIDDevice } from './device'
import { encodeJPEG } from './jpeg'
import { StreamDeckWeb } from './wrapper'

export { DeviceModelId, KeyIndex, StreamDeck } from 'elgato-stream-deck-core'
export { StreamDeckWeb } from './wrapper'
export { dropAlpha } from './util'

// TODO - typings
export async function requestStreamDeck(options?: OpenStreamDeckOptions): Promise<StreamDeckWeb | null> {
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

			const device: StreamDeck = new model.class(new WebHIDDevice(browserDevice), options || {})
			return new StreamDeckWeb(device)
		})
}
