import { detect } from 'detect-browser'
import { DEVICE_MODELS, DeviceModelId, OpenStreamDeckOptions, StreamDeck, VENDOR_ID } from '@elgato-stream-deck/core'
import { WebHIDDevice } from './device'
import { encodeJPEG } from './jpeg'
import { StreamDeckWeb } from './wrapper'

export { DeviceModelId, KeyIndex, StreamDeck } from '@elgato-stream-deck/core'
export { StreamDeckWeb } from './wrapper'

export async function requestStreamDecks(options?: OpenStreamDeckOptions): Promise<StreamDeckWeb[]> {
	// TODO - error handling
	return navigator.hid
		.requestDevice({
			filters: [
				{
					vendorId: VENDOR_ID,
				},
			],
		})
		.then(async (browserDevices) => {
			return Promise.all(browserDevices.map((dev) => openDevice(dev, options)))
		})
}

export async function openDevice(
	browserDevice: HIDDevice,
	userOptions?: OpenStreamDeckOptions
): Promise<StreamDeckWeb> {
	const model = DEVICE_MODELS.find((m) => m.productId === browserDevice.productId)
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

	const options: Required<OpenStreamDeckOptions> = {
		useOriginalKeyOrder: false,
		encodeJPEG: encodeJPEG,
		...userOptions,
	}

	const device: StreamDeck = new model.class(new WebHIDDevice(browserDevice), options || {})
	return new StreamDeckWeb(device)
}

// getStreamDeck returns a streamdeck that was previously selected.
export async function getStreamDecks(options?: OpenStreamDeckOptions): Promise<StreamDeckWeb[]> {
	// TODO - error handling
	return navigator.hid.getDevices().then(async (browserDevices) => {
		return Promise.all(browserDevices.map((dev) => openDevice(dev, options)))
	})
}
