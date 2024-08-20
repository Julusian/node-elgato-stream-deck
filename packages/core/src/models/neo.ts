import { HIDDevice } from '../hid-device'
import { EncodeJPEGHelper, OpenStreamDeckOptions } from './base'
import { DeviceModelId, Dimension } from '../id'
import { StreamDeckGen2, StreamDeckGen2Properties } from './generic-gen2'
import { StreamdeckDefaultImageWriter } from '../services/imageWriter/imageWriter'
import { StreamdeckNeoLcdImageHeaderGenerator } from '../services/imageWriter/headerGenerator'
import { FillImageOptions, FillLcdImageOptions } from '../types'
import { transformImageBuffer } from '../util'
import { InternalFillImageOptions } from '../services/buttonsLcdDisplay'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator'
import { StreamDeckControlDefinition, StreamDeckLcdStripControlDefinition } from '../controlDefinition'
import { LcdStripDisplayService } from '../services/lcdStripDisplay'

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
	}
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
	(control): control is StreamDeckLcdStripControlDefinition => control.type === 'lcd-strip'
)

export function StreamDeckNeoFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckGen2 {
	return new StreamDeckGen2(
		device,
		options,
		neoProperties,
		new StreamDeckNeoLcdService(options.encodeJPEG, device, lcdStripControls),
		null
	)
}

class StreamDeckNeoLcdService implements LcdStripDisplayService {
	readonly #encodeJPEG: EncodeJPEGHelper
	readonly #device: HIDDevice
	readonly #lcdControls: Readonly<StreamDeckLcdStripControlDefinition[]>

	readonly #lcdImageWriter = new StreamdeckDefaultImageWriter<null>(new StreamdeckNeoLcdImageHeaderGenerator())

	constructor(
		encodeJPEG: EncodeJPEGHelper,
		device: HIDDevice,
		lcdControls: Readonly<StreamDeckLcdStripControlDefinition[]>
	) {
		this.#encodeJPEG = encodeJPEG
		this.#device = device
		this.#lcdControls = lcdControls
	}

	async fillLcdRegion(
		_index: number,
		_x: number,
		_y: number,
		_imageBuffer: Buffer,
		_sourceOptions: FillLcdImageOptions
	): Promise<void> {
		throw new Error('Not supported for this model')
	}

	public async fillLcd(index: number, imageBuffer: Buffer, sourceOptions: FillImageOptions): Promise<void> {
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

		const buffer = Buffer.alloc(lcdControl.pixelSize.width * lcdControl.pixelSize.height * 4)

		await this.fillLcd(index, buffer, {
			format: 'rgba',
		})
	}

	private async convertFillLcdBuffer(
		sourceBuffer: Buffer,
		size: Dimension,
		sourceOptions: FillImageOptions
	): Promise<Buffer> {
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
			size.height
		)

		return this.#encodeJPEG(byteBuffer, size.width, size.height)
	}
}
