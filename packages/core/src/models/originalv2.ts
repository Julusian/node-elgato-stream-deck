import { HIDDevice } from '../hid-device'
import { OpenStreamDeckOptions } from './base'
import { StreamDeckGen2, StreamDeckGen2Properties } from './generic-gen2'
import { DeviceModelId } from '../id'
import { freezeDefinitions, generateButtonsGrid } from './controlsGenerator'

const origV2Properties: StreamDeckGen2Properties = {
	MODEL: DeviceModelId.ORIGINALV2,
	PRODUCT_NAME: 'Streamdeck',
	COLUMNS: 5,
	ROWS: 3,
	BUTTON_WIDTH_PX: 72,
	BUTTON_HEIGHT_PX: 72,
	// SUPPORTS_RGB_KEY_FILL: false, // TODO - verify SUPPORTS_RGB_KEY_FILL

	CONTROLS: freezeDefinitions(generateButtonsGrid(5, 3)),

	KEY_SPACING_HORIZONTAL: 25,
	KEY_SPACING_VERTICAL: 25,
}

export function StreamDeckOriginalV2Factory(
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>
): StreamDeckGen2 {
	return new StreamDeckGen2(device, options, origV2Properties, null)
}
