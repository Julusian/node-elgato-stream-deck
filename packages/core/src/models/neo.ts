import { HIDDevice } from '../hid-device.js'
import { OpenStreamDeckOptions, StreamDeckBase } from './base.js'
import { DeviceModelId } from '../id.js'
import { createBaseGen2Properties, StreamDeckGen2Properties } from './generic-gen2.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import { StreamDeckControlDefinition, StreamDeckLcdStripControlDefinition } from '../controlDefinition.js'
import { StreamDeckNeoLcdService } from '../services/lcdStripDisplay/neo.js'

const neoControls: StreamDeckControlDefinition[] = generateButtonsGrid(4, 2)
neoControls.push(
	{
		type: 'button',
		row: 2,
		column: 0,
		index: 8,
		hidIndex: 8,
		feedbackType: 'rgb',
	},
	{
		type: 'lcd-strip',
		row: 2,
		column: 1,
		columnSpan: 2,

		id: 0,

		pixelSize: {
			width: 248,
			height: 58,
		},

		drawRegions: false,
	},
	{
		type: 'button',
		row: 2,
		column: 3,
		index: 9,
		hidIndex: 9,
		feedbackType: 'rgb',
	},
)

const neoProperties: StreamDeckGen2Properties = {
	MODEL: DeviceModelId.NEO,
	PRODUCT_NAME: 'Stream Deck Neo',
	BUTTON_WIDTH_PX: 96,
	BUTTON_HEIGHT_PX: 96,

	CONTROLS: freezeDefinitions(neoControls),

	KEY_SPACING_HORIZONTAL: 30,
	KEY_SPACING_VERTICAL: 30,
}
const lcdStripControls = neoProperties.CONTROLS.filter(
	(control): control is StreamDeckLcdStripControlDefinition => control.type === 'lcd-strip',
)

export function StreamDeckNeoFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckBase {
	const services = createBaseGen2Properties(device, options, neoProperties)
	services.lcdStripDisplay = new StreamDeckNeoLcdService(options.encodeJPEG, device, lcdStripControls)

	return new StreamDeckBase(device, options, services)
}
