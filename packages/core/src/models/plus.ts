import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import { DeviceModelId } from '../id.js'
import type { StreamDeckLcdSegmentControlDefinition } from '../controlDefinition.js'
import { StreamdeckDefaultLcdService } from '../services/lcdSegmentDisplay/generic.js'
import type { StreamDeckModelInfo } from '../modelInfo.js'
import { plusProperties } from './definitions.js'

const lcdSegmentControls = plusProperties.controls.filter(
	(control): control is StreamDeckLcdSegmentControlDefinition => control.type === 'lcd-segment',
)

export function StreamDeckPlusFactory(
	info: StreamDeckModelInfo,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
): StreamDeckBase {
	const services = createBaseGen2Properties(info, device, options, plusProperties, null, {
		xFlip: false,
		yFlip: false,
	})
	services.lcdSegmentDisplay = new StreamdeckDefaultLcdService(
		options.encodeJPEG,
		device,
		lcdSegmentControls,
		false,
		DeviceModelId.PLUS,
	)

	return new StreamDeckBase(device, options, services)
}
