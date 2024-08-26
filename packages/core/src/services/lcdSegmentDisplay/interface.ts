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
	 * Clear the lcd segment to black
	 * @param {number} lcdIndex The id of the lcd segment to clear
	 */
	clearLcdSegment(lcdIndex: number): Promise<void>

	/**
	 * Clear all lcd segment to black
	 */
	clearAllLcdSegments(): Promise<void>
}
