import { detect } from 'detect-browser'
import { DEVICE_MODELS, DeviceModelId, OpenStreamDeckOptions, StreamDeck, VENDOR_ID } from 'elgato-stream-deck-core'
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
			// requestDevice returns an array because a physical device might
			// have multiple HID interfaces.  The StreamDeck only has one:
			if (browserDevice.length > 0) {
				browserDevice = browserDevice[0];
			}
			return openDevice(browserDevice, options)
		})
}

export async function openDevice(browserDevice: any, options?: OpenStreamDeckOptions): Promise<StreamDeckWeb | null> {

	const model = DEVICE_MODELS.find(m => m.productId === browserDevice.productId)
	if (!model) {
		throw new Error('Stream Deck is of unexpected type.')
	}

	if (model.id === DeviceModelId.ORIGINAL) {
		const browser = detect()
		if (browser && browser.os === 'Linux') {
			// See https://github.com/node-hid/node-hid/issues/249 for more info.
			throw new Error('This is not supported on linux')
		}
	}

	await browserDevice.open()

	options = options || {}
	if (!options.encodeJPEG) {
		options.encodeJPEG = encodeJPEG
	}

	const device: StreamDeck = new model.class(new WebHIDDevice(browserDevice), options || {})
	return new StreamDeckWeb(device)
}

// getStreamDeck returns a streamdeck that was previously selected.
export async function getStreamDeck(options?: OpenStreamDeckOptions): Promise<StreamDeckWeb | null> {
	// TODO - error handling
	return (navigator as any).hid
		.getDevices()
		.then(async (browserDevice: any) => {
			// getDevices() might return more than one, but for simplicity, just
			// pick the first one.   The user can always manually select another
			// one.
			if (browserDevice.length > 0) {
				browserDevice = browserDevice[0];
			}
			if (browserDevice.length == 0) {
				return null
			}
			return openDevice(browserDevice, options)
		})
}