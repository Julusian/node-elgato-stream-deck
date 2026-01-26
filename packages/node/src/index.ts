import type { OpenStreamDeckOptions, StreamDeck } from '@elgato-stream-deck/core'
import { DEVICE_MODELS } from '@elgato-stream-deck/core'
import * as HID from 'node-hid'
import { NodeHIDDevice, StreamDeckDeviceInfo } from './hid-device.js'
import { StreamDeckNode } from './wrapper.js'
import { encodeJPEG, JPEGEncodeOptions } from '@elgato-stream-deck/node-lib'

export {
	VENDOR_ID,
	CORSAIR_VENDOR_ID,
	DeviceModelId,
	KeyIndex,
	StreamDeck,
	StreamDeckProxy,
	LcdPosition,
	Dimension,
	StreamDeckControlDefinitionBase,
	StreamDeckButtonControlDefinition,
	StreamDeckButtonControlDefinitionNoFeedback,
	StreamDeckButtonControlDefinitionRgbFeedback,
	StreamDeckButtonControlDefinitionLcdFeedback,
	StreamDeckEncoderControlDefinition,
	StreamDeckLcdSegmentControlDefinition,
	StreamDeckControlDefinition,
	StreamDeckTcpChildDeviceInfo,
	OpenStreamDeckOptions,
	PreparedBuffer,
	getStreamDeckModelName,
} from '@elgato-stream-deck/core'

export { StreamDeckDeviceInfo, JPEGEncodeOptions }

export interface OpenStreamDeckOptionsNode extends OpenStreamDeckOptions {
	jpegOptions?: JPEGEncodeOptions
	resetToLogoOnClose?: boolean
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
	const model = DEVICE_MODELS.find((m) => m.productIds.includes(dev.productId) && m.vendorId === dev.vendorId)

	if (model && dev.path) {
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
 * @param devicePath The path of the device to open.
 * @param userOptions Options to customise the device behvaiour
 */
export async function openStreamDeck(devicePath: string, userOptions?: OpenStreamDeckOptionsNode): Promise<StreamDeck> {
	// Clone the options, to ensure they dont get changed
	const jpegOptions: JPEGEncodeOptions | undefined = userOptions?.jpegOptions
		? { ...userOptions.jpegOptions }
		: undefined

	const options: Required<OpenStreamDeckOptions> = {
		encodeJPEG: async (buffer: Uint8Array, width: number, height: number) =>
			encodeJPEG(buffer, width, height, jpegOptions),
		...userOptions,
	}

	let device: NodeHIDDevice | undefined
	try {
		const hidDevice = await HID.HIDAsync.open(devicePath)
		device = new NodeHIDDevice(hidDevice)

		const deviceInfo = await device.getDeviceInfo()

		const model = DEVICE_MODELS.find(
			(m) => deviceInfo.vendorId === m.vendorId && m.productIds.includes(deviceInfo.productId),
		)
		if (!model) {
			throw new Error('Stream Deck is of unexpected type.')
		}

		const rawSteamdeck = model.factory(device, options)
		return new StreamDeckNode(rawSteamdeck, userOptions?.resetToLogoOnClose ?? false)
	} catch (e) {
		if (device) await device.close().catch(() => null) // Suppress error
		throw e
	}
}
