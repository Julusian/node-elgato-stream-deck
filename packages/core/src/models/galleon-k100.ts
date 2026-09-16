import type { HIDDevice } from '../hid-device.js'
import type { OpenStreamDeckOptions, StreamDeckServicesDefinition } from './base.js'
import { StreamDeckBase } from './base.js'
import type { StreamDeckGen2Properties } from './generic-gen2.js'
import { createBaseGen2Properties } from './generic-gen2.js'
import { DeviceModelId, MODEL_NAMES } from '../id.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import type { PropertiesService } from '../services/properties/interface.js'
import type { StreamDeckControlDefinition, StreamDeckLcdSegmentControlDefinition } from '../controlDefinition.js'
import { GalleonK100EncoderLedService } from '../services/encoderLed/galleonK100.js'
import { StreamdeckDefaultLcdService } from '../services/lcdSegmentDisplay/generic.js'

const k100Controls: StreamDeckControlDefinition[] = generateButtonsGrid(3, 4, { width: 160, height: 160 }, false, 0, 2)
k100Controls.push(
	{
		id: `encoder-0`,
		type: 'encoder',
		row: 0,
		column: 0,
		index: 0,
		hidIndex: 0,

		hasLed: false,
		ledRingSteps: 4,
		ledRingOffset: 3,
	},
	{
		id: `encoder-1`,
		type: 'encoder',
		row: 0,
		column: 2,
		index: 1,
		hidIndex: 1,

		hasLed: false,
		ledRingSteps: 4,
		ledRingOffset: 1,
	},
	{
		id: 0,
		type: 'lcd-segment',
		row: 1,
		column: 0,
		columnSpan: 3,
		rowSpan: 1,

		index: 0,

		pixelSize: Object.freeze({
			width: 720,
			height: 384,
		}),

		drawRegions: true,
	},
)

const galleonK100Properties: StreamDeckGen2Properties = {
	model: DeviceModelId.GALLEON_K100,
	productName: MODEL_NAMES[DeviceModelId.GALLEON_K100],
	supportsRgbKeyFill: true,

	controls: freezeDefinitions(k100Controls),

	keySpacingHorizontal: 64,
	keySpacingVertical: 64,

	fullscreenPanels: 0,
	hasNfcReader: false,
	supportsChildDevices: false,
}
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
