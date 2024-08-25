import { HIDDevice } from '../hid-device.js'
import { EncodeJPEGHelper, OpenStreamDeckOptions, StreamDeckBase } from './base.js'
import { DeviceModelId, Dimension } from '../id.js'
import { createBaseGen2Properties, StreamDeckGen2Properties } from './generic-gen2.js'
import { StreamdeckDefaultImageWriter } from '../services/imageWriter/imageWriter.js'
import { StreamdeckNeoLcdImageHeaderGenerator } from '../services/imageWriter/headerGenerator.js'
import { FillImageOptions, FillLcdImageOptions } from '../types.js'
import { transformImageBuffer } from '../util.js'
import { InternalFillImageOptions } from '../services/buttonsLcdDisplay.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import { StreamDeckControlDefinition, StreamDeckLcdStripControlDefinition } from '../controlDefinition.js'
import { LcdStripDisplayService } from '../services/lcdStripDisplay.js'

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

class StreamDeckNeoLcdService implements LcdStripDisplayService {
	readonly #encodeJPEG: EncodeJPEGHelper
	readonly #device: HIDDevice
	readonly #lcdControls: Readonly<StreamDeckLcdStripControlDefinition[]>

	readonly #lcdImageWriter = new StreamdeckDefaultImageWriter<null>(new StreamdeckNeoLcdImageHeaderGenerator())

	constructor(
		encodeJPEG: EncodeJPEGHelper,
		device: HIDDevice,
		lcdControls: Readonly<StreamDeckLcdStripControlDefinition[]>,
	) {
		this.#encodeJPEG = encodeJPEG
		this.#device = device
		this.#lcdControls = lcdControls
	}

	async fillLcdRegion(
		_index: number,
		_x: number,
		_y: number,
		_imageBuffer: Uint8Array,
		_sourceOptions: FillLcdImageOptions,
	): Promise<void> {
		throw new Error('Not supported for this model')
	}

	public async fillLcd(index: number, imageBuffer: Uint8Array, sourceOptions: FillImageOptions): Promise<void> {
		const lcdControl = this.#lcdControls.find((control) => control.id === index)
		if (!lcdControl) throw new Error(`Invalid lcd strip index ${index}`)

		const imageSize = lcdControl.pixelSize.width * lcdControl.pixelSize.height * sourceOptions.format.length
		if (imageBuffer.length !== imageSize) {
			throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`)
		}

		// A lot of this drawing code is heavily based on the normal button
		const byteBuffer = await this.convertFillLcdBuffer(imageBuffer, lcdControl.pixelSize, sourceOptions)

		const packets = this.#lcdImageWriter.generateFillImageWrites(null, byteBuffer)
		await this.#device.sendReports(packets)
	}

	public async clearLcdStrip(index: number): Promise<void> {
		const lcdControl = this.#lcdControls.find((control) => control.id === index)
		if (!lcdControl) throw new Error(`Invalid lcd strip index ${index}`)

		const buffer = new Uint8Array(lcdControl.pixelSize.width * lcdControl.pixelSize.height * 4)

		await this.fillLcd(index, buffer, {
			format: 'rgba',
		})
	}

	public async clearAllLcdStrips(): Promise<void> {
		const ps: Array<Promise<void>> = []
		for (const control of this.#lcdControls) {
			ps.push(this.clearLcdStrip(control.id))
		}

		await Promise.all(ps)
	}

	private async convertFillLcdBuffer(
		sourceBuffer: Uint8Array,
		size: Dimension,
		sourceOptions: FillImageOptions,
	): Promise<Uint8Array> {
		const sourceOptions2: InternalFillImageOptions = {
			format: sourceOptions.format,
			offset: 0,
			stride: size.width * sourceOptions.format.length,
		}

		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions2,
			{ colorMode: 'rgba', xFlip: true, yFlip: true },
			0,
			size.width,
			size.height,
		)

		return this.#encodeJPEG(byteBuffer, size.width, size.height)
	}
}
