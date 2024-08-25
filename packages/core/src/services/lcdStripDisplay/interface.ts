import type { FillImageOptions, FillLcdImageOptions } from '../../types.js'

export interface LcdStripDisplayService {
	/**
	 * Fill the whole lcd strip
	 * @param {number} lcdIndex The id of the lcd strip to draw to
	 * @param {Buffer} imageBuffer The image to write
	 * @param {Object} sourceOptions Options to control the write
	 */
	fillLcd(
		lcdIndex: number,
		imageBuffer: Uint8Array | Uint8ClampedArray,
		sourceOptions: FillImageOptions,
	): Promise<void>

	/**
	 * Fill a region of the lcd strip, ignoring the boundaries of the encoders
	 * @param {number} lcdIndex The id of the lcd strip to draw to
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
	 * Clear the lcd strip to black
	 * @param {number} lcdIndex The id of the lcd strip to clear
	 */
	clearLcdStrip(lcdIndex: number): Promise<void>

	/**
	 * Clear all lcd strips to black
	 */
	clearAllLcdStrips(): Promise<void>
}