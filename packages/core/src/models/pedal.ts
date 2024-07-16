import { HIDDevice } from '../hid-device'
import { OpenStreamDeckOptions, StreamDeckInputBase, StreamDeckProperties } from './base'
import { DeviceModelId } from '../id'
import { FillImageOptions, FillPanelOptions } from '../types'

const pedalProperties: StreamDeckProperties = {
	MODEL: DeviceModelId.PEDAL,
	PRODUCT_NAME: 'Streamdeck Pedal',
	COLUMNS: 3,
	ROWS: 1,
	TOUCH_BUTTONS: 0,
	BUTTON_WIDTH_PX: 0,
	BUTTON_HEIGHT_PX: 0,
	KEY_DIRECTION: 'ltr',
	KEY_DATA_OFFSET: 3,
	ENCODER_COUNT: 0,
	SUPPORTS_RGB_KEY_FILL: false,

	KEY_SPACING_HORIZONTAL: 0,
	KEY_SPACING_VERTICAL: 0,
}

export class StreamDeckPedal extends StreamDeckInputBase {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(device, options, pedalProperties)
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

	public async fillKeyColor(_keyIndex: number, _r: number, _g: number, _b: number): Promise<void> {
		// Not supported
	}
	public async fillKeyBuffer(_keyIndex: number, _imageBuffer: Buffer, _options?: FillImageOptions): Promise<void> {
		// Not supported
	}
	public async fillPanelBuffer(_imageBuffer: Buffer, _options?: FillPanelOptions): Promise<void> {
		// Not supported
	}
	public async clearKey(_keyIndex: number): Promise<void> {
		// Not supported
	}
	public async clearPanel(): Promise<void> {
		// Not supported
	}
}
