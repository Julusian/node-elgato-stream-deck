import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import { DeviceModelId, MODEL_NAMES } from '../id.js'
import type { StreamDeckGen2Properties } from './generic-gen2.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import type { StreamDeckControlDefinition, StreamDeckLcdSegmentControlDefinition } from '../controlDefinition.js'
import { StreamDeckNeoLcdService } from '../services/lcdSegmentDisplay/neo.js'

const neoControls: StreamDeckControlDefinition[] = generateButtonsGrid(4, 2, { width: 96, height: 96 })
neoControls.push(
	{
		id: 'page-l',
		type: 'button',
		row: 2,
		column: 0,
		index: 8,
		hidIndex: 8,
		feedbackType: 'rgb',
	},
	{
		id: 0,
		type: 'lcd-segment',
		row: 2,
		column: 1,
		columnSpan: 2,
		rowSpan: 1,

		index: 0,

		pixelSize: {
			width: 248,
			height: 58,
		},

		drawRegions: false,
	},
	{
		id: 'page-r',
		type: 'button',
		row: 2,
		column: 3,
		index: 9,
		hidIndex: 9,
		feedbackType: 'rgb',
	},
)

const neoProperties: StreamDeckGen2Properties = {
	model: DeviceModelId.NEO,
	productName: MODEL_NAMES[DeviceModelId.NEO],

	controls: freezeDefinitions(neoControls),

	keySpacingHorizontal: 30,
	keySpacingVertical: 30,

	fullscreenPanels: 1,
	hasNfcReader: false,
	supportsChildDevices: false,
	supportsRgbKeyFill: true,
}
const lcdSegmentControls = neoProperties.controls.filter(
	(control): control is StreamDeckLcdSegmentControlDefinition => control.type === 'lcd-segment',
)

export function StreamDeckNeoFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckBase {
	const services = createBaseGen2Properties(device, options, neoProperties, null)
	services.lcdSegmentDisplay = new StreamDeckNeoLcdService(options.encodeJPEG, device, lcdSegmentControls)

	return new StreamDeckBase(device, options, services)
}
