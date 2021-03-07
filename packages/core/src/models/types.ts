import { DeviceModelId, KeyIndex } from './id'

export interface FillImageOptions {
	format: 'rgb' | 'rgba' | 'bgr' | 'bgra'
}
export type FillPanelOptions = FillImageOptions

export interface StreamDeck {
	/** The number of keys on this streamdeck */
	readonly NUM_KEYS: number
	/** The number of columns on this streamdeck */
	readonly KEY_COLUMNS: number
	/** The number of rows on this streamdeck */
	readonly KEY_ROWS: number

	/** The horizontal/vertical resolution of the buttons */
	readonly ICON_SIZE: number
	/** The total number of pixels of a button */
	readonly ICON_PIXELS: number
	/** The number of bytes for a RGB encoded image for a button */
	readonly ICON_BYTES: number

	/** The model of this device */
	readonly MODEL: DeviceModelId

	/**
	 * Checks if a keyIndex is valid. Throws an error on failure
	 * @param keyIndex The key to check
	 */
	checkValidKeyIndex(keyIndex: KeyIndex): void

	/**
	 * Close the device
	 */
	close(): Promise<void>

	/**
	 * Fills the given key with a solid color.
	 *
	 * @param {number} keyIndex The key to fill
	 * @param {number} r The color's red value. 0 - 255
	 * @param {number} g The color's green value. 0 - 255
	 * @param {number} b The color's blue value. 0 -255
	 */
	fillKeyColor(keyIndex: KeyIndex, r: number, g: number, b: number): Promise<void>

	/**
	 * Fills the given key with an image in a Buffer.
	 *
	 * @param {number} keyIndex The key to fill
	 * @param {Buffer} imageBuffer The image to write
	 * @param {Object} options Options to control the write
	 */
	fillKeyBuffer(keyIndex: KeyIndex, imageBuffer: Buffer, options?: FillImageOptions): Promise<void>

	/**
	 * Fills the whole panel with an image in a Buffer.
	 *
	 * @param {Buffer} imageBuffer The image to write
	 * @param {Object} options Options to control the write
	 */
	fillPanelBuffer(imageBuffer: Buffer, options?: FillPanelOptions): Promise<void>

	/**
	 * Clears the given key.
	 *
	 * @param {number} keyIndex The key to clear
	 */
	clearKey(keyIndex: KeyIndex): Promise<void>

	/**
	 * Clears all keys.
	 */
	clearPanel(): Promise<void>

	/**
	 * Sets the brightness of the keys on the Stream Deck
	 *
	 * @param {number} percentage The percentage brightness
	 */
	setBrightness(percentage: number): Promise<void>

	/**
	 * Resets the display to the startup logo
	 */
	resetToLogo(): Promise<void>

	/**
	 * Get firmware version from Stream Deck
	 */
	getFirmwareVersion(): Promise<string>

	/**
	 * Get serial number from Stream Deck
	 */
	getSerialNumber(): Promise<string>

	on(
		...args:
			| [event: 'down' | 'up', listener: (keyIndex: KeyIndex) => void]
			| [event: 'error', listener: (e: unknown) => void]
	): StreamDeck
}
