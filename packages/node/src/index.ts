import { DEVICE_MODELS, OpenStreamDeckOptions, StreamDeck, VENDOR_ID } from '@elgato-stream-deck/core'
import * as HID from 'node-hid'
import { NodeHIDDevice, NodeHIDSyncDevice, StreamDeckDeviceInfo } from './device'
import { encodeJPEG, JPEGEncodeOptions } from './jpeg'
import { StreamDeckNode } from './wrapper'

export { DeviceModelId, KeyIndex, StreamDeck } from '@elgato-stream-deck/core'

export interface OpenStreamDeckOptionsNode extends OpenStreamDeckOptions {
	jpegOptions?: JPEGEncodeOptions
	resetToLogoOnClose?: boolean

	/**
	 * @deprecated
	 * Backwards compatibility option, for using the sync node-hid implementation.
	 * This should not be used and will be removed in a future minor version
	 */
	useSyncNodeHid?: boolean
}

/**
 * Scan for and list detected devices
 */
export async function listStreamDecks(): Promise<StreamDeckDeviceInfo[]> {
	const devices: Record<string, StreamDeckDeviceInfo> = {}
	for (const dev of await HID.devicesAsync()) {
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
export async function getStreamDeckInfo(path: string): Promise<StreamDeckDeviceInfo | undefined> {
	const allDevices = await listStreamDecks()
	return allDevices.find((dev) => dev.path === path)
}

/**
 * Open a streamdeck
 * @param devicePath The path of the device to open. If not set, the first will be used
 * @param userOptions Options to customise the device behvaiour
 */
export async function openStreamDeck(devicePath: string, userOptions?: OpenStreamDeckOptionsNode): Promise<StreamDeck> {
	// Clone the options, to ensure they dont get changed
	const jpegOptions: JPEGEncodeOptions | undefined = userOptions?.jpegOptions
		? { ...userOptions.jpegOptions }
		: undefined

	const options: Required<OpenStreamDeckOptions> = {
		encodeJPEG: async (buffer: Buffer, width: number, height: number) =>
			encodeJPEG(buffer, width, height, jpegOptions),
		...userOptions,
	}

	let device: NodeHIDDevice | NodeHIDSyncDevice | undefined
	try {
		if (userOptions?.useSyncNodeHid) {
			const hidDevice = new HID.HID(devicePath)
			device = new NodeHIDSyncDevice(hidDevice)
		} else {
			const hidDevice = await HID.HIDAsync.open(devicePath)
			device = new NodeHIDDevice(hidDevice)
		}

		const deviceInfo = await device.getDeviceInfo()

		const model = DEVICE_MODELS.find(
			(m) => m.productId === deviceInfo.productId && deviceInfo.vendorId === VENDOR_ID
		)
		if (!model) {
			throw new Error('Stream Deck is of unexpected type.')
		}

		const rawSteamdeck = new model.class(device, options)
		return new StreamDeckNode(rawSteamdeck, userOptions?.resetToLogoOnClose ?? false)
	} catch (e) {
		if (device) await device.close().catch(() => null) // Suppress error
		throw e
	}
}
