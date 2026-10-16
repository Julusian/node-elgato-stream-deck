import type { StreamDeckLcdSegmentControlDefinition } from '../../controlDefinition.js'
import type { HIDDevice } from '../../hid-device.js'
import type { Dimension } from '../../id.js'
import type { InternalFillImageOptions } from '../imagePacker/interface.js'
import { StreamdeckNeoLcdImageHeaderGenerator } from '../imageWriter/headerGenerator.js'
import { StreamdeckDefaultImageWriter } from '../imageWriter/imageWriter.js'
import type { LcdSegmentDisplayService } from './interface.js'
import type { FillLcdImageOptions, FillImageOptions } from '../../types.js'
import { transformImageBuffer } from '../../util.js'
import type { EncodeJPEGHelper } from '../../models/base.js'
import type { PreparedBuffer } from '../../preparedBuffer.js'
import { PendingWriteTracker } from '../pendingWrites.js'

export class StreamDeckNeoLcdService implements LcdSegmentDisplayService {
	readonly #encodeJPEG: EncodeJPEGHelper
	readonly #device: HIDDevice
	readonly #lcdControls: Readonly<StreamDeckLcdSegmentControlDefinition[]>
	readonly #pendingWrites = new PendingWriteTracker()

	readonly #lcdImageWriter = new StreamdeckDefaultImageWriter<null>(new StreamdeckNeoLcdImageHeaderGenerator())

	constructor(
		encodeJPEG: EncodeJPEGHelper,
		device: HIDDevice,
		lcdControls: Readonly<StreamDeckLcdSegmentControlDefinition[]>,
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
		_signal: AbortSignal | null,
	): Promise<boolean> {
		throw new Error('Not supported for this model')
	}

	public async prepareFillLcdRegion(
		_index: number,
		_x: number,
		_y: number,
		_imageBuffer: Uint8Array,
		_sourceOptions: FillLcdImageOptions,
		_jsonSafe?: boolean,
	): Promise<PreparedBuffer> {
		throw new Error('Not supported for this model')
	}

	public async fillLcd(
		index: number,
		imageBuffer: Uint8Array,
		sourceOptions: FillImageOptions,
		signal: AbortSignal | null,
	): Promise<boolean> {
		const lcdControl = this.#lcdControls.find((control) => control.id === index)
		if (!lcdControl) throw new Error(`Invalid lcd segment index ${index}`)

		const imageSize = lcdControl.pixelSize.width * lcdControl.pixelSize.height * sourceOptions.format.length
		if (imageBuffer.length !== imageSize) {
			throw new RangeError(`Expected image buffer of length ${imageSize}, got length ${imageBuffer.length}`)
		}

		return this.#pendingWrites.run(`lcd:${lcdControl.id}`, signal, async (ctx) => {
			// Avoid encoding an image which will not be sent
			if (ctx.signal?.aborted) return false

			// A lot of this drawing code is heavily based on the normal button
			const byteBuffer = await this.convertFillLcdBuffer(imageBuffer, lcdControl.pixelSize, sourceOptions)

			const packets = this.#lcdImageWriter.generateFillImageWrites(null, byteBuffer)
			return ctx.commit(async (writeSignal) => this.#device.sendReports(packets, writeSignal))
		})
	}

	public async clearLcdSegment(index: number, signal: AbortSignal | null): Promise<boolean> {
		const lcdControl = this.#lcdControls.find((control) => control.id === index)
		if (!lcdControl) throw new Error(`Invalid lcd segment index ${index}`)

		const buffer = new Uint8Array(lcdControl.pixelSize.width * lcdControl.pixelSize.height * 4)

		return this.fillLcd(
			index,
			buffer,
			{
				format: 'rgba',
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
