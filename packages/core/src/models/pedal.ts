import { HIDDevice } from '../hid-device.js'
import { OpenStreamDeckOptions, StreamDeckBase, StreamDeckProperties } from './base.js'
import { DeviceModelId, Dimension } from '../id.js'
import { FillImageOptions, FillPanelDimensionsOptions, FillPanelOptions } from '../types.js'
import { StreamDeckControlDefinition } from '../controlDefinition.js'
import { freezeDefinitions } from '../controlsGenerator.js'
import type { ButtonsLcdDisplayService } from '../services/buttonsLcdDisplay.js'
import { PropertiesService } from '../services/propertiesService.js'

const pedalControls: StreamDeckControlDefinition[] = [
	{
		type: 'button',
		row: 0,
		column: 0,
		index: 0,
		hidIndex: 0,
		feedbackType: 'none',
	},
	{
		type: 'button',
		row: 0,
		column: 1,
		index: 1,
		hidIndex: 1,
		feedbackType: 'none',
	},
	{
		type: 'button',
		row: 0,
		column: 2,
		index: 2,
		hidIndex: 2,
		feedbackType: 'none',
	},
]

const pedalProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.PEDAL,
	PRODUCT_NAME: 'Stream Deck Pedal',
	BUTTON_WIDTH_PX: 0,
	BUTTON_HEIGHT_PX: 0,
	KEY_DATA_OFFSET: 3,
	SUPPORTS_RGB_KEY_FILL: false,

	CONTROLS: freezeDefinitions(pedalControls),

	KEY_SPACING_HORIZONTAL: 0,
	KEY_SPACING_VERTICAL: 0,
}

class PedalLcdService implements ButtonsLcdDisplayService {
	public calculateFillPanelDimensions(_options?: FillPanelDimensionsOptions): Dimension | null {
		// Not supported
		return null
	}
	public async clearKey(_keyIndex: number): Promise<void> {
		// Not supported
	}
	public async clearPanel(): Promise<void> {
		// Not supported
	}
	public async fillKeyColor(_keyIndex: number, _r: number, _g: number, _b: number): Promise<void> {
		// Not supported
	}
	public async fillKeyBuffer(
		_keyIndex: number,
		_imageBuffer: Uint8Array,
		_options?: FillImageOptions,
	): Promise<void> {
		// Not supported
	}
	public async fillPanelBuffer(_imageBuffer: Uint8Array, _options?: FillPanelOptions): Promise<void> {
		// Not supported
	}
}

class PedalPropertiesService implements PropertiesService {
	readonly #device: HIDDevice

	constructor(device: HIDDevice) {
		this.#device = device
	}

	public async setBrightness(_percentage: number): Promise<void> {
		// Not supported
	}

	public async resetToLogo(): Promise<void> {
		// Not supported
	}

	public async getFirmwareVersion(): Promise<string> {
		const val = await this.#device.getFeatureReport(5, 32)
		const end = val.indexOf(0, 6)
		return new TextDecoder('ascii').decode(val.subarray(6, end === -1 ? undefined : end))
	}

	public async getSerialNumber(): Promise<string> {
		const val = await this.#device.getFeatureReport(6, 32)
		return new TextDecoder('ascii').decode(val.subarray(2, 14))
	}
}

export function StreamDeckPedalFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckBase {
	return new StreamDeckBase(device, options, {
		deviceProperties: pedalProperties,
		events: null,
		properties: new PedalPropertiesService(device),
		buttonsLcd: new PedalLcdService(),
		lcdStripDisplay: null,
		lcdStripInput: null,
		encoderInput: null,
	})
}
