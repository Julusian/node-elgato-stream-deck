import { MODEL_NAMES, type DeviceModelId } from './id.js'

export * from './types.js'
export * from './id.js'
export * from './controlDefinition.js'
export type { PreparedBuffer } from './preparedBuffer.js'
export type { HIDDevice, HIDDeviceInfo, HIDDeviceEvents, ChildHIDDeviceInfo } from './hid-device.js'
export type { OpenStreamDeckOptions } from './models/base.js'
export { StreamDeckProxy } from './proxy.js'
export type { PropertiesService } from './services/properties/interface.js'
export { uint8ArrayToDataView } from './util.js'
export { parseAllFirmwareVersionsHelper } from './services/properties/all-firmware.js'

export {
	VENDOR_ID,
	CORSAIR_VENDOR_ID,
	DeviceModelType,
	DEVICE_MODEL_INFO,
	getModelInfo,
	findModelByUsb,
} from './modelInfo.js'
export type { StreamDeckModelInfo, StreamDeckModelFeatures, StreamDeckTransport, UsbMatch } from './modelInfo.js'

export { DEVICE_MODELS, DEVICE_MODELS2, getDriver } from './registry.js'
export type { DeviceModelSpec, StreamDeckFactory } from './registry.js'

export function getStreamDeckModelName(modelId: DeviceModelId): string {
	return MODEL_NAMES[modelId] || 'Unknown Stream Deck'
}
