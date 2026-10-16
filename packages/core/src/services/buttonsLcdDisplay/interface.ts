import type { Dimension, KeyIndex } from '../../id.js'
import type { FillImageOptions, FillPanelDimensionsOptions, FillPanelOptions } from '../../types.js'
import type { PreparedBuffer } from '../../preparedBuffer.js'

export interface GridSpan {
	minRow: number
	maxRow: number
	minCol: number
	maxCol: number
}

export interface ButtonsLcdDisplayService {
	calculateFillPanelDimensions(options: FillPanelDimensionsOptions | undefined): Dimension | null

	clearPanel(signal: AbortSignal | null): Promise<boolean>
	clearKey(keyIndex: KeyIndex, signal: AbortSignal | null): Promise<boolean>

	fillKeyColor(keyIndex: KeyIndex, r: number, g: number, b: number, signal: AbortSignal | null): Promise<boolean>
	fillKeyBuffer(
		keyIndex: KeyIndex,
		imageBuffer: Uint8Array,
		options: FillImageOptions | undefined,
		signal: AbortSignal | null,
	): Promise<boolean>
	prepareFillKeyBuffer(
		keyIndex: KeyIndex,
		imageBuffer: Uint8Array | Uint8ClampedArray,
		options: FillImageOptions | undefined,
		jsonSafe: boolean | undefined,
	): Promise<PreparedBuffer>

	fillPanelBuffer(
		imageBuffer: Uint8Array,
		options: FillPanelOptions | undefined,
		signal: AbortSignal | null,
	): Promise<boolean>
	prepareFillPanelBuffer(
		imageBuffer: Uint8Array | Uint8ClampedArray,
		options: FillPanelOptions | undefined,
		jsonSafe: boolean | undefined,
	): Promise<PreparedBuffer>
}
