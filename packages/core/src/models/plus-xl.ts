import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions } from './base.js'
import { StreamDeckBase } from './base.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import { DeviceModelId } from '../id.js'
import type { StreamDeckLcdSegmentControlDefinition } from '../controlDefinition.js'
import { StreamdeckDefaultLcdService } from '../services/lcdSegmentDisplay/generic.js'
import type { StreamDeckModelInfo } from '../modelInfo.js'
import { plusXlProperties } from './definitions.js'

const lcdSegmentControls = plusXlProperties.controls.filter(
	(control): control is StreamDeckLcdSegmentControlDefinition => control.type === 'lcd-segment',
)

export function StreamDeckPlusXlFactory(
	info: StreamDeckModelInfo,
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
): StreamDeckBase {
	const services = createBaseGen2Properties(info, device, options, plusXlProperties, null, {
		rotate: true,
		yFlip: true,
	})
	services.lcdSegmentDisplay = new StreamdeckDefaultLcdService(
		options.encodeJPEG,
		device,
		lcdSegmentControls,
		true,
		DeviceModelId.PLUS_XL,
	)

	return new StreamDeckBase(device, options, services)
}
