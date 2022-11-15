import { DEVICE_MODELS, OpenStreamDeckOptions, StreamDeck, VENDOR_ID } from '@elgato-stream-deck/core'
import { WebHIDDevice } from './device'
import { encodeJPEG } from './jpeg'
import { StreamDeckWeb } from './wrapper'

export { DeviceModelId, KeyIndex, StreamDeck, LcdPosition } from '@elgato-stream-deck/core'
export { StreamDeckWeb } from './wrapper'

/**
 * Request the user to select some streamdecks to open
 * @param userOptions Options to customise the device behvaiour
 */
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
			return Promise.all(browserDevices.map(async (dev) => openDevice(dev, options)))
		})
}

/**
 * Reopen previously selected streamdecks.
 * The browser remembers what the user previously allowed your site to access, and this will open those without the request dialog
 * @param options Options to customise the device behvaiour
 */
export async function getStreamDecks(options?: OpenStreamDeckOptions): Promise<StreamDeckWeb[]> {
	// TODO - error handling
	return navigator.hid.getDevices().then(async (browserDevices) => {
		return Promise.all(browserDevices.map(async (dev) => openDevice(dev, options)))
	})
}

/**
 * Open a StreamDeck from a manually selected HIDDevice handle
 * @param browserDevice The unopened browser HIDDevice
 * @param userOptions Options to customise the device behvaiour
 */
export async function openDevice(
	browserDevice: HIDDevice,
	userOptions?: OpenStreamDeckOptions
): Promise<StreamDeckWeb> {
	const model = DEVICE_MODELS.find((m) => m.productId === browserDevice.productId)
	if (!model) {
		throw new Error('Stream Deck is of unexpected type.')
	}

	// if (model.id === DeviceModelId.ORIGINAL) {
	// 	const browser = detect()
	// 	if (browser && browser.os === 'Linux') {
	// 		// See https://github.com/node-hid/node-hid/issues/249 for more info.
	// 		throw new Error('This is not supported on linux')
	// 	}
	// }

	await browserDevice.open()

	const options: Required<OpenStreamDeckOptions> = {
		useOriginalKeyOrder: false,
		encodeJPEG: encodeJPEG,
		...userOptions,
	}

	const device: StreamDeck = new model.class(new WebHIDDevice(browserDevice), options || {})
	return new StreamDeckWeb(device)
}
