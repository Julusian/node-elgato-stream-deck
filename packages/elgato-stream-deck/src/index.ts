import { DEVICE_MODELS, OpenStreamDeckOptions, StreamDeck, VENDOR_ID } from 'elgato-stream-deck-core'
import * as HID from 'node-hid'
import { NodeHIDDevice, StreamDeckDeviceInfo } from './device'
import { encodeJPEG, JPEGEncodeOptions } from './jpeg'

export { DeviceModelId, KeyIndex, StreamDeck } from 'elgato-stream-deck-core'

export interface OpenStreamDeckOptionsNode extends OpenStreamDeckOptions {
	jpegOptions?: JPEGEncodeOptions
}

/*
 * The original StreamDeck uses packet sizes too large for the hidraw driver which is
 * the default on linux. https://github.com/node-hid/node-hid/issues/249
 */
HID.setDriverType('libusb')

/**
 * List detected devices
 */
export function listStreamDecks(): StreamDeckDeviceInfo[] {
	const devices: StreamDeckDeviceInfo[] = []
	for (const dev of HID.devices()) {
		const model = DEVICE_MODELS.find((m) => m.productId === dev.productId)

		if (model && dev.vendorId === VENDOR_ID && dev.path) {
			devices.push({
				model: model.id,
				path: dev.path,
				serialNumber: dev.serialNumber,
			})
		}
	}
	return devices
}

/**
 * Get the info of a device if the given path is a streamdeck
 */
export function getStreamDeckInfo(path: string): StreamDeckDeviceInfo | undefined {
	return listStreamDecks().find((dev) => dev.path === path)
}

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
	const options: OpenStreamDeckOptionsNode = { ...userOptions }

	if (!options.encodeJPEG) {
		const jpegOptions: JPEGEncodeOptions | undefined = options.jpegOptions ? { ...options.jpegOptions } : undefined
		options.encodeJPEG = (buffer: Buffer, width: number, height: number) =>
			encodeJPEG(buffer, width, height, jpegOptions)
	}

	const device = new NodeHIDDevice(foundDevices[0])
	return new model.class(device, options || {})
}
