import type { StreamDeckLcdSegmentControlDefinition } from '../../controlDefinition.js'
import type { HIDDevice } from '../../hid-device.js'
import type { InternalFillImageOptions } from '../imagePacker/interface.js'
import { StreamdeckDefaultLcdImageHeaderGenerator } from '../imageWriter/headerGenerator.js'
import { StreamdeckDefaultImageWriter } from '../imageWriter/imageWriter.js'
import type { LcdSegmentDisplayService } from './interface.js'
import type { FillImageOptions, FillLcdImageOptions } from '../../types.js'
import { transformImageBuffer } from '../../util.js'
import type { EncodeJPEGHelper } from '../../models/base.js'
import { wrapBufferToPreparedBuffer, type PreparedBuffer } from '../../preparedBuffer.js'
import type { DeviceModelId } from '../../id.js'
import { PendingWriteTracker } from '../pendingWrites.js'

export class StreamdeckDefaultLcdService implements LcdSegmentDisplayService {
	readonly #encodeJPEG: EncodeJPEGHelper
	readonly #device: HIDDevice
	readonly #lcdControls: Readonly<StreamDeckLcdSegmentControlDefinition[]>
	readonly #rotate: boolean
	readonly #modelId: DeviceModelId
	readonly #pendingWrites = new PendingWriteTracker()

	readonly #lcdImageWriter = new StreamdeckDefaultImageWriter(new StreamdeckDefaultLcdImageHeaderGenerator())

	constructor(
		encodeJPEG: EncodeJPEGHelper,
		device: HIDDevice,
		lcdControls: Readonly<StreamDeckLcdSegmentControlDefinition[]>,
		rotate: boolean,
		modelId: DeviceModelId,
	) {
		this.#encodeJPEG = encodeJPEG
		this.#device = device
		this.#lcdControls = lcdControls
		this.#rotate = rotate
		this.#modelId = modelId
	}

	public async fillLcd(
		index: number,
		buffer: Uint8Array | Uint8ClampedArray,
		sourceOptions: FillImageOptions,
		signal: AbortSignal | null,
	): Promise<boolean> {
		const lcdControl = this.#lcdControls.find((control) => control.id === index)
		if (!lcdControl) throw new Error(`Invalid lcd segment index ${index}`)

		return this.#fillControlRegion(
			lcdControl,
			0,
			0,
			buffer,
			{
				format: sourceOptions.format,
				width: lcdControl.pixelSize.width,
				height: lcdControl.pixelSize.height,
			},
			signal,
		)
	}

	public async fillLcdRegion(
		index: number,
		x: number,
		y: number,
		imageBuffer: Uint8Array,
		sourceOptions: FillLcdImageOptions,
		signal: AbortSignal | null,
	): Promise<boolean> {
		const lcdControl = this.#lcdControls.find((control) => control.id === index)
		if (!lcdControl) throw new Error(`Invalid lcd segment index ${index}`)

		return this.#fillControlRegion(lcdControl, x, y, imageBuffer, sourceOptions, signal)
	}

	async #fillControlRegion(
		lcdControl: StreamDeckLcdSegmentControlDefinition,
		x: number,
		y: number,
		imageBuffer: Uint8Array | Uint8ClampedArray,
		sourceOptions: FillLcdImageOptions,
		signal: AbortSignal | null,
	): Promise<boolean> {
		this.checkFillControlRegion(lcdControl, x, y, imageBuffer, sourceOptions)

		return this.#pendingWrites.run(`lcd:${lcdControl.id}`, signal, async (ctx) => {
			// Avoid encoding an image which will not be sent
			if (ctx.signal?.aborted) return false

			const packets = await this.encodeFillControlRegion(x, y, imageBuffer, sourceOptions)
			return ctx.commit(async (writeSignal) => this.#device.sendReports(packets, writeSignal))
		})
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
		return wrapBufferToPreparedBuffer(this.#modelId, 'fill-lcd-region', packets, jsonSafe ?? false)
	}

	public async clearLcdSegment(index: number, signal: AbortSignal | null): Promise<boolean> {
		const lcdControl = this.#lcdControls.find((control) => control.id === index)
		if (!lcdControl) throw new Error(`Invalid lcd segment index ${index}`)

		const buffer = new Uint8Array(lcdControl.pixelSize.width * lcdControl.pixelSize.height * 4)

		return this.#fillControlRegion(
			lcdControl,
			0,
			0,
			buffer,
			{
				format: 'rgba',
				width: lcdControl.pixelSize.width,
				height: lcdControl.pixelSize.height,
			},
			signal,
		)
	}

	public async clearAllLcdSegments(signal: AbortSignal | null): Promise<boolean> {
		const ps: Array<Promise<boolean>> = []
		for (const control of this.#lcdControls) {
			ps.push(this.clearLcdSegment(control.id, signal))
		}

		const results = await Promise.all(ps)
		return results.every(Boolean)
	}

	private async prepareFillControlRegion(
		lcdControl: StreamDeckLcdSegmentControlDefinition,
		x: number,
		y: number,
		imageBuffer: Uint8Array | Uint8ClampedArray,
		sourceOptions: FillLcdImageOptions,
	): Promise<Uint8Array[]> {
		this.checkFillControlRegion(lcdControl, x, y, imageBuffer, sourceOptions)

		return this.encodeFillControlRegion(x, y, imageBuffer, sourceOptions)
	}

	private checkFillControlRegion(
		lcdControl: StreamDeckLcdSegmentControlDefinition,
		x: number,
		y: number,
		imageBuffer: Uint8Array | Uint8ClampedArray,
		sourceOptions: FillLcdImageOptions,
	): void {
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
	}

	private async encodeFillControlRegion(
		x: number,
		y: number,
		imageBuffer: Uint8Array | Uint8ClampedArray,
		sourceOptions: FillLcdImageOptions,
	): Promise<Uint8Array[]> {
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
			{ colorMode: 'rgba', rotate: this.#rotate, yFlip: this.#rotate },
			0,
			sourceOptions.width,
			sourceOptions.height,
		)

		return this.#encodeJPEG(
			byteBuffer,
			this.#rotate ? sourceOptions.height : sourceOptions.width,
			this.#rotate ? sourceOptions.width : sourceOptions.height,
		)
	}
}
