import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions, StreamDeckServicesDefinition } from './base.js'
import { StreamDeckBase } from './base.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import { DeviceModelId } from '../id.js'
import type { PropertiesService } from '../services/properties/interface.js'
import type { StreamDeckLcdSegmentControlDefinition } from '../controlDefinition.js'
import { GalleonK100EncoderLedService } from '../services/encoderLed/galleonK100.js'
import { StreamdeckDefaultLcdService } from '../services/lcdSegmentDisplay/generic.js'
import { galleonK100Properties } from './definitions.js'

const lcdSegmentControls = galleonK100Properties.controls.filter(
	(control): control is StreamDeckLcdSegmentControlDefinition => control.type === 'lcd-segment',
)

export async function GalleonK100Factory(
	device: HIDDevice,
	options: Required<OpenStreamDeckOptions>,
	_tcpPropertiesService?: PropertiesService,
): Promise<StreamDeckBase> {
	const services = createBaseGen2Properties(device, options, galleonK100Properties, null, {
		xFlip: false,
		yFlip: false,
	})
	services.encoderLed = new GalleonK100EncoderLedService(device, galleonK100Properties.controls)
	services.lcdSegmentDisplay = new StreamdeckDefaultLcdService(
		options.encodeJPEG,
		device,
		lcdSegmentControls,
		false,
		DeviceModelId.GALLEON_K100,
	)

	const streamDeck = new GalleonK100StreamDeck(device, options, services)

	// Wait for the device to be ready
	await new Promise((resolve) => setTimeout(resolve, 200))

	return streamDeck
}

class GalleonK100StreamDeck extends StreamDeckBase {
	readonly #pingInterval: NodeJS.Timeout

	constructor(
		device: HIDDevice,
		options: Readonly<Required<OpenStreamDeckOptions>>,
		services: StreamDeckServicesDefinition,
	) {
		super(device, options, services)

		// Stop the ping upon error
		device.on('error', () => this.#stopPing())

		this.#pingInterval = setInterval(this.#sendPing, 500)
		this.#sendPing()
	}

	public async close(): Promise<void> {
		this.#stopPing()

		return super.close()
	}

	#sendPing = (): void => {
		this.device.sendFeatureReport(new Uint8Array([0x03, 0x27])).catch((e) => {
			// Emit as an error on the streamdeck
			this.emit('error', e)
			this.#stopPing()
		})
	}

	#stopPing(): void {
		// Stop pinging
		clearInterval(this.#pingInterval)
	}
}
