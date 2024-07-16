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
	const browserDevices = await navigator.hid.requestDevice({
		filters: [
			{
				vendorId: VENDOR_ID,
			},
		],
	})

	return Promise.all(browserDevices.map(async (dev) => openDevice(dev, options)))
}

/**
 * Reopen previously selected streamdecks.
 * The browser remembers what the user previously allowed your site to access, and this will open those without the request dialog
 * @param options Options to customise the device behvaiour
 */
export async function getStreamDecks(options?: OpenStreamDeckOptions): Promise<StreamDeckWeb[]> {
	const browserDevices = await navigator.hid.getDevices()
	const validDevices = browserDevices.filter((d) => d.vendorId === VENDOR_ID)

	const resultDevices = await Promise.all(
		validDevices.map(async (dev) => openDevice(dev, options).catch((_) => null)) // Ignore failures
	)

	return resultDevices.filter((v): v is StreamDeckWeb => !!v)
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
	const model = DEVICE_MODELS.find(
		(m) => browserDevice.vendorId === VENDOR_ID && m.productIds.includes(browserDevice.productId)
	)
	if (!model) {
		throw new Error('Stream Deck is of unexpected type.')
	}

	await browserDevice.open()

	try {
		const options: Required<OpenStreamDeckOptions> = {
			encodeJPEG: encodeJPEG,
			...userOptions,
		}

		const browserHid = new WebHIDDevice(browserDevice)
		const device: StreamDeck = new model.class(browserHid, options || {})
		return new StreamDeckWeb(device, browserHid)
	} catch (e) {
		await browserDevice.close().catch(() => null) // Suppress error

		throw e
	}
}
