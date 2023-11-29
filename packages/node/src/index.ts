import { DEVICE_MODELS, OpenStreamDeckOptions, StreamDeck, VENDOR_ID } from '@elgato-stream-deck/core'
import * as HID from 'node-hid'
import { NodeHIDDevice, StreamDeckDeviceInfo } from './device'
import { encodeJPEG, JPEGEncodeOptions } from './jpeg'
import { StreamDeckNode } from './wrapper'

export { DeviceModelId, KeyIndex, StreamDeck } from '@elgato-stream-deck/core'

export interface OpenStreamDeckOptionsNode extends OpenStreamDeckOptions {
	jpegOptions?: JPEGEncodeOptions
	resetToLogoOnClose?: boolean
}

/**
 * Scan for and list detected devices
 */
export function listStreamDecks(): StreamDeckDeviceInfo[] {
	const devices: Record<string, StreamDeckDeviceInfo> = {}
	for (const dev of HID.devices()) {
		if (dev.path && !devices[dev.path]) {
			const info = getStreamDeckDeviceInfo(dev)
			if (info) devices[dev.path] = info
		}
	}
	return Object.values<StreamDeckDeviceInfo>(devices)
}

/**
 * If the provided device is a streamdeck, get the info about it
 */
export function getStreamDeckDeviceInfo(dev: HID.Device): StreamDeckDeviceInfo | null {
	const model = DEVICE_MODELS.find((m) => m.productId === dev.productId)

	if (model && dev.vendorId === VENDOR_ID && dev.path) {
		return {
			model: model.id,
			path: dev.path,
			serialNumber: dev.serialNumber,
		}
	} else {
		return null
	}
}

/**
 * Get the info of a device if the given path is a streamdeck
 */
export function getStreamDeckInfo(path: string): StreamDeckDeviceInfo | undefined {
	return listStreamDecks().find((dev) => dev.path === path)
}

/**
 * Open a streamdeck
 * @param devicePath The path of the device to open. If not set, the first will be used
 * @param userOptions Options to customise the device behvaiour
 */
export function openStreamDeck(devicePath?: string, userOptions?: OpenStreamDeckOptionsNode): StreamDeck {
	let foundDevices = listStreamDecks()
	if (devicePath) {
		foundDevices = foundDevices.filter((d) => d.path === devicePath)
	}

	if (foundDevices.length === 0) {
		if (devicePath) {
			throw new Error(`Device "${devicePath}" was not found`)
		} else {
			throw new Error('No Stream Decks are connected.')
		}
	}

	const model = DEVICE_MODELS.find((m) => m.id === foundDevices[0].model)
	if (!model) {
		throw new Error('Stream Deck is of unexpected type.')
	}

	// Clone the options, to ensure they dont get changed
	const jpegOptions: JPEGEncodeOptions | undefined = userOptions?.jpegOptions
		? { ...userOptions.jpegOptions }
		: undefined

	const options: Required<OpenStreamDeckOptions> = {
		useOriginalKeyOrder: false,
		encodeJPEG: async (buffer: Buffer, width: number, height: number) =>
			encodeJPEG(buffer, width, height, jpegOptions),
		...userOptions,
	}

	const device = new NodeHIDDevice(foundDevices[0])
	const rawSteamdeck = new model.class(device, options)
	return new StreamDeckNode(rawSteamdeck, userOptions?.resetToLogoOnClose ?? false)
}
