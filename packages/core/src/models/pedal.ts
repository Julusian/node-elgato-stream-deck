import { HIDDevice } from '../hid-device'
import { OpenStreamDeckOptions, StreamDeckBase, StreamDeckProperties } from './base'
import { DeviceModelId, Dimension } from '../id'
import { FillImageOptions, FillPanelDimensionsOptions, FillPanelOptions } from '../types'
import { StreamDeckControlDefinition } from '../controlDefinition'
import { freezeDefinitions } from '../controlsGenerator'
import type { ButtonsLcdDisplayService } from '../services/buttonsLcdDisplay'

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
	PRODUCT_NAME: 'Streamdeck Pedal',
	BUTTON_WIDTH_PX: 0,
	BUTTON_HEIGHT_PX: 0,
	KEY_DATA_OFFSET: 3,
	SUPPORTS_RGB_KEY_FILL: false,

	CONTROLS: freezeDefinitions(pedalControls),

	KEY_SPACING_HORIZONTAL: 0,
	KEY_SPACING_VERTICAL: 0,
}

class StreamDeckPedal extends StreamDeckBase {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, pedalProperties, new PedalLcdService(), null)
	}

	/**
	 * Sets the brightness of the keys on the Stream Deck
	 *
	 * @param {number} percentage The percentage brightness
	 */
	public async setBrightness(_percentage: number): Promise<void> {
		// Not supported
	}

	public async resetToLogo(): Promise<void> {
		// Not supported
	}

	public async getFirmwareVersion(): Promise<string> {
		const val = await this.device.getFeatureReport(5, 32)
		const end = val.indexOf(0, 6)
		return val.toString('ascii', 6, end === -1 ? undefined : end)
	}

	public async getSerialNumber(): Promise<string> {
		const val = await this.device.getFeatureReport(6, 32)
		return val.toString('ascii', 2, 14)
	}
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
	public async fillKeyBuffer(_keyIndex: number, _imageBuffer: Buffer, _options?: FillImageOptions): Promise<void> {
		// Not supported
	}
	public async fillPanelBuffer(_imageBuffer: Buffer, _options?: FillPanelOptions): Promise<void> {
		// Not supported
	}
}

export function StreamDeckPedalFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckPedal {
	return new StreamDeckPedal(device, options)
}
