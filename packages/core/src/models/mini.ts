import { HIDDevice } from '../hid-device'
import { OpenStreamDeckOptions } from './base'
import { StreamDeckGen1, StreamDeckGen1Properties } from './generic-gen1'
import { DeviceModelId } from '../id'
import { freezeDefinitions, generateButtonsGrid } from './controlsGenerator'

const miniProperties: StreamDeckGen1Properties = {
	MODEL: DeviceModelId.MINI,
	PRODUCT_NAME: 'Streamdeck Mini',
	COLUMNS: 3,
	ROWS: 2,
	BUTTON_WIDTH_PX: 80,
	BUTTON_HEIGHT_PX: 80,
	SUPPORTS_RGB_KEY_FILL: false, // TODO - verify this

	CONTROLS: freezeDefinitions(generateButtonsGrid(3, 2)),

	KEY_SPACING_HORIZONTAL: 28,
	KEY_SPACING_VERTICAL: 28,
}

export function StreamDeckMiniFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckGen1 {
	return new StreamDeckGen1(device, options, miniProperties, { colorMode: 'bgr', rotate: true, yFlip: true }, 2835)
}
