import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import type { StreamDeckLcdSegmentControlDefinition } from '../controlDefinition.js'
import { StreamDeckNeoLcdService } from '../services/lcdSegmentDisplay/neo.js'
import type { StreamDeckModelInfo } from '../modelInfo.js'
import { neoProperties } from './definitions.js'

const lcdSegmentControls = neoProperties.controls.filter(
	(control): control is StreamDeckLcdSegmentControlDefinition => control.type === 'lcd-segment',
)

export function StreamDeckNeoFactory(
	info: StreamDeckModelInfo,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
): StreamDeckBase {
	const services = createBaseGen2Properties(info, device, options, neoProperties, null)
	services.lcdSegmentDisplay = new StreamDeckNeoLcdService(options.encodeJPEG, device, lcdSegmentControls)

	return new StreamDeckBase(device, options, services)
}
