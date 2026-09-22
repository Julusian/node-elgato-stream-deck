import type { HIDDevice } from './hid-device.js'
import { DeviceModelId } from './id.js'
import type { StreamDeck } from './types.js'
import type { OpenStreamDeckOptions } from './models/base.js'
import type { PropertiesService } from './services/properties/interface.js'
import type { DeviceModelType, StreamDeckModelDefinition, StreamDeckModelInfo } from './modelInfo.js'
import { DEVICE_MODEL_DEFINITIONS, DEVICE_MODEL_INFO, VENDOR_ID } from './modelInfo.js'
import { StreamDeckOriginalFactory } from './models/original.js'
import { StreamDeck6KeyFactory } from './models/6-key.js'
import { StreamDeckGen2Factory } from './models/generic-gen2.js'
import { StreamDeckPlusFactory } from './models/plus.js'
import { StreamDeckPedalFactory } from './models/pedal.js'
import { StreamDeckNeoFactory } from './models/neo.js'
import { StreamDeckStudioFactory } from './models/studio.js'
import { NetworkDockFactory } from './models/network-dock.js'
import { GalleonK100Factory } from './models/galleon-k100.js'
import { StreamDeckPlusXlFactory } from './models/plus-xl.js'

/**
 * Constructs a StreamDeck for a model, from its definition.
 * Internal: the definition carries the properties, which are not public.
 */
type StreamDeckModelFactory = (
	definition: StreamDeckModelDefinition,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	tcpPropertiesService?: PropertiesService,
) => StreamDeck | Promise<StreamDeck>

/** Opens a device of a known model. Already bound to the model it was looked up by */
export type StreamDeckDriver = (
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	tcpPropertiesService?: PropertiesService,
) => StreamDeck | Promise<StreamDeck>

export interface DeviceModelSpec {
	id: DeviceModelId
	type: DeviceModelType
	productIds: number[]
	vendorId: number
	productName: string
	/**
	 * If needing to filter by usage
	 */
	hidUsage?: number
	/**
	 * If needing to filter by interface number
	 */
	hidInterface?: number

	factory: (
		device: HIDDevice,
		options: Required<OpenStreamDeckOptions>,
		tcpPropertiesService?: PropertiesService,
	) => StreamDeck | Promise<StreamDeck>

	hasNativeTcp: boolean
}

const DEVICE_MODEL_FACTORIES: { [id in DeviceModelId]: StreamDeckModelFactory } = {
	[DeviceModelId.ORIGINAL]: StreamDeckOriginalFactory,
	[DeviceModelId.MINI]: StreamDeck6KeyFactory,
	[DeviceModelId.XL]: StreamDeckGen2Factory,
	[DeviceModelId.ORIGINALV2]: StreamDeckGen2Factory,
	[DeviceModelId.ORIGINALMK2]: StreamDeckGen2Factory,
	[DeviceModelId.ORIGINALMK2SCISSOR]: StreamDeckGen2Factory,
	[DeviceModelId.PLUS]: StreamDeckPlusFactory,
	[DeviceModelId.PEDAL]: StreamDeckPedalFactory,
	[DeviceModelId.NEO]: StreamDeckNeoFactory,
	[DeviceModelId.STUDIO]: StreamDeckStudioFactory,
	[DeviceModelId.MODULE6]: StreamDeck6KeyFactory,
	[DeviceModelId.MODULE15]: StreamDeckGen2Factory,
	[DeviceModelId.MODULE15SCISSOR]: StreamDeckGen2Factory,
	[DeviceModelId.MODULE32]: StreamDeckGen2Factory,
	[DeviceModelId.NETWORK_DOCK]: NetworkDockFactory,
	[DeviceModelId.GALLEON_K100]: GalleonK100Factory,
	[DeviceModelId.PLUS_XL]: StreamDeckPlusXlFactory,
}

/**
 * Each factory bound to its own model definition, so a caller can never pair a
 * driver with a model it was not built for.
 */
const DEVICE_MODEL_DRIVERS: { [id in DeviceModelId]: StreamDeckDriver } = Object.freeze(
	Object.fromEntries(
		Object.values(DEVICE_MODEL_DEFINITIONS).map((definition): [DeviceModelId, StreamDeckDriver] => [
			definition.info.id,
			async (device, options, tcpPropertiesService) =>
				DEVICE_MODEL_FACTORIES[definition.info.id](definition, device, options, tcpPropertiesService),
		]),
	),
) as { [id in DeviceModelId]: StreamDeckDriver }

/**
 * The usb identifiers to report for models which are not usb devices.
 * These aren't real, but are what the device reports when queried.
 */
const FAKE_USB_IDS: Partial<Record<DeviceModelId, Pick<DeviceModelSpec, 'vendorId' | 'productIds'>>> = {
	[DeviceModelId.NETWORK_DOCK]: { vendorId: VENDOR_ID, productIds: [0xffff] },
}

function createLegacySpec(info: StreamDeckModelInfo): Omit<DeviceModelSpec, 'id' | 'productName'> {
	const fakeUsbIds = FAKE_USB_IDS[info.id]

	return {
		type: info.category,
		vendorId: fakeUsbIds?.vendorId ?? info.usb[0].vendorId,
		productIds: fakeUsbIds?.productIds ?? info.usb.map((match) => match.productId),

		hidUsage: info.usb[0]?.hidUsage,
		hidInterface: info.usb[0]?.hidInterface,

		factory: DEVICE_MODEL_DRIVERS[info.id],

		hasNativeTcp: info.transports.includes('tcp'),
	}
}

/**
 * List of all the known models, and the classes to use them
 * @deprecated Use {@link DEVICE_MODEL_INFO} and {@link getDriver} instead
 */
export const DEVICE_MODELS2: { [key in DeviceModelId]: Omit<DeviceModelSpec, 'id' | 'productName'> } =
	Object.fromEntries(Object.values(DEVICE_MODEL_INFO).map((info) => [info.id, createLegacySpec(info)])) as {
		[key in DeviceModelId]: Omit<DeviceModelSpec, 'id' | 'productName'>
	}

/** @deprecated Use {@link DEVICE_MODEL_INFO} instead */
export const DEVICE_MODELS: DeviceModelSpec[] = Object.entries<Omit<DeviceModelSpec, 'id' | 'productName'>>(
	DEVICE_MODELS2,
).map(([id, spec]) => {
	const modelId = id as any as DeviceModelId
	return { id: modelId, productName: DEVICE_MODEL_INFO[modelId].name, ...spec }
})

/**
 * Get the factory to open a device of a model
 * @internal
 */
export function getDriver(id: DeviceModelId): StreamDeckDriver | undefined {
	return DEVICE_MODEL_DRIVERS[id]
}
