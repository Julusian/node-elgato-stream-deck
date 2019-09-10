import { DEVICE_MODELS, OpenStreamDeckOptions, StreamDeck, VENDOR_ID } from 'elgato-stream-deck-core'
import { WebHIDDevice } from './device'

export { DeviceModelId, StreamDeck } from 'elgato-stream-deck-core'

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
			if (!options.encodeJPEG) { options.encodeJPEG = buf => buf } // TODO

			return new model.class(new WebHIDDevice(browserDevice), options || {})
		})
}
