import * as HID from 'node-hid'

import {
	DeviceModelId,
	OpenStreamDeckOptions,
	StreamDeck,
	StreamDeckDeviceInfo,
	StreamDeckMini,
	StreamDeckOriginal,
	StreamDeckOriginalV2,
	StreamDeckOriginalMK2,
	StreamDeckXL,
	StreamDeckMiniV2
} from './models'
import { StreamDeckBase } from './models/base'

export { DeviceModelId, KeyIndex, StreamDeck, StreamDeckDeviceInfo, OpenStreamDeckOptions } from './models'
export { JPEGEncodeOptions } from './jpeg'

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
		const model = models.find(m => m.productId === dev.productId)

		if (model && dev.vendorId === 0x0fd9 && dev.path) {
			devices.push({
				model: model.id,
				path: dev.path,
				serialNumber: dev.serialNumber
			})
		}
	}
	return devices
}

/**
 * Get the info of a device if the given path is a streamdeck
 */
export function getStreamDeckInfo(path: string): StreamDeckDeviceInfo | undefined {
	return listStreamDecks().find(dev => dev.path === path)
}

interface ModelSpec {
	id: DeviceModelId
	productId: number
	class: new (deviceInfo: StreamDeckDeviceInfo, options: OpenStreamDeckOptions) => StreamDeckBase
}

const models: ModelSpec[] = [
	{
		id: DeviceModelId.ORIGINAL,
		productId: 0x0060,
		class: StreamDeckOriginal
	},
	{
		id: DeviceModelId.MINI,
		productId: 0x0063,
		class: StreamDeckMini
	},
	{
		id: DeviceModelId.XL,
		productId: 0x006c,
		class: StreamDeckXL
	},
	{
		id: DeviceModelId.ORIGINALV2,
		productId: 0x006d,
		class: StreamDeckOriginalV2
	},
	{
		id: DeviceModelId.ORIGINALMK2,
		productId: 0x0080,
		class: StreamDeckOriginalMK2
	},
	{
		id: DeviceModelId.MINIV2,
		productId: 0x0090,
		class: StreamDeckMiniV2
	}
]

export function openStreamDeck(devicePath?: string, userOptions?: OpenStreamDeckOptions): StreamDeck {
	let foundDevices = listStreamDecks()
	if (devicePath) {
		foundDevices = foundDevices.filter(d => d.path === devicePath)
	}

	if (foundDevices.length === 0) {
		if (devicePath) {
			throw new Error(`Device "${devicePath}" was not found`)
		} else {
			throw new Error('No Stream Decks are connected.')
		}
	}

	// Clone the options, to ensure they dont get changed
	const options: OpenStreamDeckOptions = { ...userOptions }

	const model = models.find(m => m.id === foundDevices[0].model)
	if (!model) {
		throw new Error('Stream Deck is of unexpected type.')
	}
	return new model.class(foundDevices[0], options)
}
