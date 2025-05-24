import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions, StreamDeckProperties } from './base.js'
import { StreamDeckBase } from './base.js'
import type { StreamDeckGen2Properties } from './generic-gen2.js'
import { type DeviceModelId, MODEL_NAMES } from '../id.js'
import { freezeDefinitions } from '../controlsGenerator.js'
import type { PropertiesService } from '../services/properties/interface.js'
import type { StreamDeckEvents } from '../types.js'
import { CallbackHook } from '../services/callback-hook.js'
import { PedalLcdService } from '../services/buttonsLcdDisplay/pedal.js'
import { FakeInputService } from '../services/input/fake.js'
import { parseAllFirmwareVersionsHelper } from '../services/properties/all-firmware.js'

const networkDockProperties: Omit<StreamDeckGen2Properties, 'MODEL' | 'PRODUCT_NAME'> = {
	SUPPORTS_RGB_KEY_FILL: false, // TODO - verify SUPPORTS_RGB_KEY_FILL

	CONTROLS: freezeDefinitions([]),

	KEY_SPACING_HORIZONTAL: 0,
	KEY_SPACING_VERTICAL: 0,

	FULLSCREEN_PANELS: 0,
	HAS_NFC_READER: false,
	SUPPORTS_CHILD_DEVICES: true,
}

export function NetworkDockFactory(
	model: DeviceModelId,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	_tcpPropertiesService?: PropertiesService,
): StreamDeckBase {
	const properties: StreamDeckProperties = {
		...networkDockProperties,
		MODEL: model,
		PRODUCT_NAME: MODEL_NAMES[model],
		KEY_DATA_OFFSET: 0,
	}

	const events = new CallbackHook<StreamDeckEvents>()

	return new StreamDeckBase(device, options, {
		deviceProperties: properties,
		events,
		properties: new NetworkDockPropertiesService(device),
		buttonsLcd: new PedalLcdService(),
		lcdSegmentDisplay: null,
		inputService: new FakeInputService(),
		encoderLed: null,
	})
}

class NetworkDockPropertiesService implements PropertiesService {
	readonly #device: HIDDevice

	constructor(device: HIDDevice) {
		this.#device = device
	}

	public async setBrightness(_percentage: number): Promise<void> {
		// Noop
	}

	public async resetToLogo(): Promise<void> {
		// Noop
	}

	public async getFirmwareVersion(): Promise<string> {
		const data = await this.#device.getFeatureReport(0x83, -1)

		return new TextDecoder('ascii').decode(data.subarray(8, 16))
	}

	public async getAllFirmwareVersions(): Promise<Record<string, string>> {
		const [ap2Data] = await Promise.all([this.#device.getFeatureReport(0x83, -1)])

		return parseAllFirmwareVersionsHelper({
			ap2: ap2Data.slice(2),
			encoderAp2: null,
			encoderLd: null,
		})
	}

	public async getSerialNumber(): Promise<string> {
		const data = await this.#device.getFeatureReport(0x84, -1)

		const length = data[3]
		return new TextDecoder('ascii').decode(data.subarray(4, 4 + length))
	}
}
