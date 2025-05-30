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

	clearPanel(): Promise<void>
	clearKey(keyIndex: KeyIndex): Promise<void>

	fillKeyColor(keyIndex: KeyIndex, r: number, g: number, b: number): Promise<void>
	fillKeyBuffer(keyIndex: KeyIndex, imageBuffer: Uint8Array, options?: FillImageOptions): Promise<void>
	prepareFillKeyBuffer(
		keyIndex: KeyIndex,
		imageBuffer: Uint8Array | Uint8ClampedArray,
		options: FillImageOptions | undefined,
		jsonSafe: boolean | undefined,
	): Promise<PreparedBuffer>

	fillPanelBuffer(imageBuffer: Uint8Array, options: FillPanelOptions | undefined): Promise<void>
	prepareFillPanelBuffer(
		imageBuffer: Uint8Array | Uint8ClampedArray,
		options: FillPanelOptions | undefined,
		jsonSafe: boolean | undefined,
	): Promise<PreparedBuffer>
}
