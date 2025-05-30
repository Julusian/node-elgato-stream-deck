import type { PreparedBuffer } from '../../preparedBuffer.js'
import type { FillImageOptions, FillLcdImageOptions } from '../../types.js'

export interface LcdSegmentDisplayService {
	/**
	 * Fill the whole lcd segment
	 * @param {number} lcdIndex The id of the lcd segment to draw to
	 * @param {Buffer} imageBuffer The image to write
	 * @param {Object} sourceOptions Options to control the write
	 */
	fillLcd(
		lcdIndex: number,
		imageBuffer: Uint8Array | Uint8ClampedArray,
		sourceOptions: FillImageOptions,
	): Promise<void>

	/**
	 * Fill a region of the lcd segment, ignoring the boundaries of the encoders
	 * @param {number} lcdIndex The id of the lcd segment to draw to
	 * @param {number} x The x position to draw to
	 * @param {number} y The y position to draw to
	 * @param {Buffer} imageBuffer The image to write
	 * @param {Object} sourceOptions Options to control the write
	 */
	fillLcdRegion(
		lcdIndex: number,
		x: number,
		y: number,
		imageBuffer: Uint8Array | Uint8ClampedArray,
		sourceOptions: FillLcdImageOptions,
	): Promise<void>

	/**
	 * Prepare to fill region of the lcd with an image in a Buffer.
	 * Note: The result is only guaranteed to be valid for this specific StreamDeck and the same library version, but is safe to store externally.
	 *
	 * @param {number} lcdIndex The id of the lcd segment to draw to
	 * @param {number} x The x position to draw to
	 * @param {number} y The y position to draw to
	 * @param {Buffer} imageBuffer The image to write
	 * @param {Object} sourceOptions Options to control the write
	 */
	prepareFillLcdRegion(
		lcdIndex: number,
		x: number,
		y: number,
		imageBuffer: Uint8Array,
		sourceOptions: FillLcdImageOptions,
		jsonSafe?: boolean,
	): Promise<PreparedBuffer>

	/**
	 * Clear the lcd segment to black
	 * @param {number} lcdIndex The id of the lcd segment to clear
	 */
	clearLcdSegment(lcdIndex: number): Promise<void>

	/**
	 * Clear all lcd segment to black
	 */
	clearAllLcdSegments(): Promise<void>
}
