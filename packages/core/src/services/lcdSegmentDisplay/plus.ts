import type { StreamDeckLcdSegmentControlDefinition } from '../../controlDefinition.js'
import type { HIDDevice } from '../../hid-device.js'
import type { InternalFillImageOptions } from '../imagePacker/interface.js'
import { StreamdeckPlusLcdImageHeaderGenerator } from '../imageWriter/headerGenerator.js'
import { StreamdeckDefaultImageWriter } from '../imageWriter/imageWriter.js'
import type { LcdSegmentDisplayService } from './interface.js'
import type { FillImageOptions, FillLcdImageOptions } from '../../types.js'
import { transformImageBuffer } from '../../util.js'
import type { EncodeJPEGHelper } from '../../models/base.js'
import { unwrapPreparedBufferToBuffer, wrapBufferToPreparedBuffer, type PreparedBuffer } from '../../preparedBuffer.js'
import { DeviceModelId } from '../../id.js'

export class StreamDeckPlusLcdService implements LcdSegmentDisplayService {
	readonly #encodeJPEG: EncodeJPEGHelper
	readonly #device: HIDDevice
	readonly #lcdControls: Readonly<StreamDeckLcdSegmentControlDefinition[]>

	readonly #lcdImageWriter = new StreamdeckDefaultImageWriter(new StreamdeckPlusLcdImageHeaderGenerator())

	constructor(
		encodeJPEG: EncodeJPEGHelper,
		device: HIDDevice,
		lcdControls: Readonly<StreamDeckLcdSegmentControlDefinition[]>,
	) {
		this.#encodeJPEG = encodeJPEG
		this.#device = device
		this.#lcdControls = lcdControls
	}

	public async fillLcd(
		index: number,
		buffer: Uint8Array | Uint8ClampedArray,
		sourceOptions: FillImageOptions,
	): Promise<void> {
		const lcdControl = this.#lcdControls.find((control) => control.id === index)
		if (!lcdControl) throw new Error(`Invalid lcd segment index ${index}`)

		const packets = await this.prepareFillControlRegion(lcdControl, 0, 0, buffer, {
			format: sourceOptions.format,
			width: lcdControl.pixelSize.width,
			height: lcdControl.pixelSize.height,
		})
		await this.#device.sendReports(packets)
	}

	public async fillLcdRegion(
		index: number,
		x: number,
		y: number,
		imageBuffer: Uint8Array,
		sourceOptions: FillLcdImageOptions,
	): Promise<void> {
		const lcdControl = this.#lcdControls.find((control) => control.id === index)
		if (!lcdControl) throw new Error(`Invalid lcd segment index ${index}`)

		const packets = await this.prepareFillControlRegion(lcdControl, x, y, imageBuffer, sourceOptions)
		await this.#device.sendReports(packets)
	}

	public async prepareFillLcdRegion(
		index: number,
		x: number,
		y: number,
		imageBuffer: Uint8Array,
		sourceOptions: FillLcdImageOptions,
		jsonSafe?: boolean,
	): Promise<PreparedBuffer> {
		const lcdControl = this.#lcdControls.find((control) => control.id === index)
		if (!lcdControl) throw new Error(`Invalid lcd segment index ${index}`)

		const packets = await this.prepareFillControlRegion(lcdControl, x, y, imageBuffer, sourceOptions)
		return wrapBufferToPreparedBuffer(DeviceModelId.PLUS, 'fill-lcd-region', packets, jsonSafe ?? false)
	}

	public async sendPreparedFillLcdRegion(buffer: PreparedBuffer): Promise<void> {
		const packets = unwrapPreparedBufferToBuffer(DeviceModelId.PLUS, 'fill-lcd-region', buffer)
		await this.#device.sendReports(packets)
	}

	public async clearLcdSegment(index: number): Promise<void> {
		const lcdControl = this.#lcdControls.find((control) => control.id === index)
		if (!lcdControl) throw new Error(`Invalid lcd segment index ${index}`)

		const buffer = new Uint8Array(lcdControl.pixelSize.width * lcdControl.pixelSize.height * 4)

		const packets = await this.prepareFillControlRegion(lcdControl, 0, 0, buffer, {
			format: 'rgba',
			width: lcdControl.pixelSize.width,
			height: lcdControl.pixelSize.height,
		})
		await this.#device.sendReports(packets)
	}

	public async clearAllLcdSegments(): Promise<void> {
		const ps: Array<Promise<void>> = []
		for (const control of this.#lcdControls) {
			ps.push(this.clearLcdSegment(control.id))
		}

		await Promise.all(ps)
	}

	private async prepareFillControlRegion(
		lcdControl: StreamDeckLcdSegmentControlDefinition,
		x: number,
		y: number,
		imageBuffer: Uint8Array | Uint8ClampedArray,
		sourceOptions: FillLcdImageOptions,
	): Promise<Uint8Array[]> {
		// Basic bounds checking
		const maxSize = lcdControl.pixelSize
		if (x < 0 || x + sourceOptions.width > maxSize.width) {
			throw new TypeError(`Image will not fit within the lcd segment`)
		}
		if (y < 0 || y + sourceOptions.height > maxSize.height) {
			throw new TypeError(`Image will not fit within the lcd segment`)
		}

		const imageSize = sourceOptions.width * sourceOptions.height * sourceOptions.format.length
		if (imageBuffer.length !== imageSize) {
			throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`)
		}

		// A lot of this drawing code is heavily based on the normal button
		const byteBuffer = await this.convertFillLcdBuffer(imageBuffer, sourceOptions)

		return this.#lcdImageWriter.generateFillImageWrites({ ...sourceOptions, x, y }, byteBuffer)
	}

	private async convertFillLcdBuffer(
		sourceBuffer: Uint8Array | Uint8ClampedArray,
		sourceOptions: FillLcdImageOptions,
	): Promise<Uint8Array> {
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
