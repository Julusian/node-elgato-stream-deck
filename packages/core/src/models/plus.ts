import { transformImageBuffer } from '../util.js'
import { FillImageOptions, FillLcdImageOptions, StreamDeckEvents } from '../types.js'
import { HIDDevice } from '../hid-device.js'
import { EncodeJPEGHelper, OpenStreamDeckOptions } from './base.js'
import { StreamDeckGen2, StreamDeckGen2Properties } from './generic-gen2.js'
import { DeviceModelId } from '../id.js'
import { StreamdeckDefaultImageWriter } from '../services/imageWriter/imageWriter.js'
import { StreamdeckPlusLcdImageHeaderGenerator } from '../services/imageWriter/headerGenerator.js'
import { InternalFillImageOptions } from '../services/buttonsLcdDisplay.js'
import { freezeDefinitions, generateButtonsGrid } from '../controlsGenerator.js'
import { StreamDeckControlDefinition, StreamDeckLcdStripControlDefinition } from '../controlDefinition.js'
import { LcdStripInputService } from '../services/lcdStripInput.js'
import { LcdStripDisplayService } from '../services/lcdStripDisplay.js'

const plusControls: StreamDeckControlDefinition[] = generateButtonsGrid(4, 2)
plusControls.push(
	{
		type: 'lcd-strip',
		row: 2,
		column: 0,
		columnSpan: 4,

		id: 0,

		pixelSize: Object.freeze({
			width: 800,
			height: 100,
		}),

		drawRegions: true,
	},
	{
		type: 'encoder',
		row: 3,
		column: 0,
		index: 0,
		hidIndex: 0,
	},
	{
		type: 'encoder',
		row: 3,
		column: 1,
		index: 1,
		hidIndex: 1,
	},
	{
		type: 'encoder',
		row: 3,
		column: 2,
		index: 2,
		hidIndex: 2,
	},
	{
		type: 'encoder',
		row: 3,
		column: 3,
		index: 3,
		hidIndex: 3,
	},
)

const plusProperties: StreamDeckGen2Properties = {
	MODEL: DeviceModelId.PLUS,
	PRODUCT_NAME: 'Stream Deck +',
	BUTTON_WIDTH_PX: 120,
	BUTTON_HEIGHT_PX: 120,

	CONTROLS: freezeDefinitions(plusControls),

	KEY_SPACING_HORIZONTAL: 99,
	KEY_SPACING_VERTICAL: 40,
}
const lcdStripControls = plusProperties.CONTROLS.filter(
	(control): control is StreamDeckLcdStripControlDefinition => control.type === 'lcd-strip',
)

class StreamDeckPlus extends StreamDeckGen2 {
	constructor(device: HIDDevice, options: Required<OpenStreamDeckOptions>) {
		super(
			device,
			options,
			plusProperties,
			new StreamDeckPlusLcdService(options.encodeJPEG, device, lcdStripControls),
			new LcdStripInputService(lcdStripControls, (key, ...args) => this.emit(key, ...args)),
			true,
		)
	}
}

export function StreamDeckPlusFactory(device: HIDDevice, options: Required<OpenStreamDeckOptions>): StreamDeckGen2 {
	// TODO - remove this class, once the event emitting is possible
	return new StreamDeckPlus(device, options)
}

class StreamDeckPlusLcdService implements LcdStripDisplayService {
	readonly #encodeJPEG: EncodeJPEGHelper
	readonly #device: HIDDevice
	readonly #lcdControls: Readonly<StreamDeckLcdStripControlDefinition[]>

	readonly #lcdImageWriter = new StreamdeckDefaultImageWriter(new StreamdeckPlusLcdImageHeaderGenerator())

	constructor(
		encodeJPEG: EncodeJPEGHelper,
		device: HIDDevice,
		lcdControls: Readonly<StreamDeckLcdStripControlDefinition[]>,
	) {
		this.#encodeJPEG = encodeJPEG
		this.#device = device
		this.#lcdControls = lcdControls
	}

	public async fillLcd(index: number, buffer: Buffer, sourceOptions: FillImageOptions): Promise<void> {
		const lcdControl = this.#lcdControls.find((control) => control.id === index)
		if (!lcdControl) throw new Error(`Invalid lcd strip index ${index}`)

		return this.fillControlRegion(lcdControl, 0, 0, buffer, {
			format: sourceOptions.format,
			width: lcdControl.pixelSize.width,
			height: lcdControl.pixelSize.height,
		})
	}

	// public async fillEncoderLcd(index: EncoderIndex, buffer: Buffer, sourceOptions: FillImageOptions): Promise<void> {
	// 	if (this.#encoderCount === 0) throw new Error(`There are no encoders`)

	// 	const size = this.LCD_ENCODER_SIZE
	// 	const x = index * size.width

	// 	return this.fillLcdRegion(x, 0, buffer, {
	// 		format: sourceOptions.format,
	// 		width: size.width,
	// 		height: size.height,
	// 	})
	// }

	public async fillLcdRegion(
		index: number,
		x: number,
		y: number,
		imageBuffer: Buffer,
		sourceOptions: FillLcdImageOptions,
	): Promise<void> {
		const lcdControl = this.#lcdControls.find((control) => control.id === index)
		if (!lcdControl) throw new Error(`Invalid lcd strip index ${index}`)

		return this.fillControlRegion(lcdControl, x, y, imageBuffer, sourceOptions)
	}

	public async clearLcdStrip(index: number): Promise<void> {
		const lcdControl = this.#lcdControls.find((control) => control.id === index)
		if (!lcdControl) throw new Error(`Invalid lcd strip index ${index}`)

		const buffer = Buffer.alloc(lcdControl.pixelSize.width * lcdControl.pixelSize.height * 4)

		await this.fillControlRegion(lcdControl, 0, 0, buffer, {
			format: 'rgba',
			width: lcdControl.pixelSize.width,
			height: lcdControl.pixelSize.height,
		})
	}

	private async fillControlRegion(
		lcdControl: StreamDeckLcdStripControlDefinition,
		x: number,
		y: number,
		imageBuffer: Buffer,
		sourceOptions: FillLcdImageOptions,
	): Promise<void> {
		// Basic bounds checking
		const maxSize = lcdControl.pixelSize
		if (x < 0 || x + sourceOptions.width > maxSize.width) {
			throw new TypeError(`Image will not fit within the lcd strip`)
		}
		if (y < 0 || y + sourceOptions.height > maxSize.height) {
			throw new TypeError(`Image will not fit within the lcd strip`)
		}

		const imageSize = sourceOptions.width * sourceOptions.height * sourceOptions.format.length
		if (imageBuffer.length !== imageSize) {
			throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`)
		}

		// A lot of this drawing code is heavily based on the normal button
		const byteBuffer = await this.convertFillLcdBuffer(imageBuffer, sourceOptions)

		const packets = this.#lcdImageWriter.generateFillImageWrites({ ...sourceOptions, x, y }, byteBuffer)
		await this.#device.sendReports(packets)
	}

	private async convertFillLcdBuffer(sourceBuffer: Buffer, sourceOptions: FillLcdImageOptions): Promise<Buffer> {
		const sourceOptions2: InternalFillImageOptions = {
			format: sourceOptions.format,
			offset: 0,
			stride: sourceOptions.width * sourceOptions.format.length,
		}

		const byteBuffer = transformImageBuffer(
			sourceBuffer,
			sourceOptions2,
			{ colorMode: 'rgba' },
			0,
			sourceOptions.width,
			sourceOptions.height,
		)

		return this.#encodeJPEG(byteBuffer, sourceOptions.width, sourceOptions.height)
	}
}

export type SomeEmitEventFn = EmitEventFn<keyof StreamDeckEvents>
type EmitEventFn<K extends keyof StreamDeckEvents> = (key: K, ...args: StreamDeckEvents[K]) => void
