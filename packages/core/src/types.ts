import * as EventEmitter from 'eventemitter3'
import { DeviceModelId, EncoderIndex, KeyIndex } from './id'
import { HIDDeviceInfo } from './device'

export interface FillImageOptions {
	format: 'rgb' | 'rgba' | 'bgr' | 'bgra'
}
export type FillPanelOptions = FillImageOptions

export interface FillLcdImageOptions extends FillImageOptions {
	width: number
	height: number
}

export interface LcdPosition {
	x: number
	y: number
}

export type StreamDeckEvents = {
	down: [key: KeyIndex]
	up: [key: KeyIndex]
	error: [err: unknown]
	rotateLeft: [encoder: EncoderIndex, amount: number]
	rotateRight: [encoder: EncoderIndex, amount: number]
	encoderDown: [encoder: EncoderIndex]
	encoderUp: [encoder: EncoderIndex]
	lcdShortPress: [encoder: EncoderIndex, position: LcdPosition]
	lcdLongPress: [encoder: EncoderIndex, position: LcdPosition]
	lcdSwipe: [fromEncoder: EncoderIndex, toEncoder: EncoderIndex, from: LcdPosition, to: LcdPosition]
}

export interface LcdSegmentSize {
	width: number
	height: number
}

export interface StreamDeck extends EventEmitter<StreamDeckEvents> {
	/** The number of keys on this streamdeck */
	readonly NUM_KEYS: number
	/** The number of columns on this streamdeck */
	readonly KEY_COLUMNS: number
	/** The number of rows on this streamdeck */
	readonly KEY_ROWS: number

	/** The number of encoders on this streamdeck (if any) */
	readonly NUM_ENCODERS: number
	/** The full size of the lcd strip on this streamdeck (if any) */
	readonly LCD_STRIP_SIZE: LcdSegmentSize | undefined
	/** The size of the lcd per encoder on this streamdeck (if any) */
	readonly LCD_ENCODER_SIZE: LcdSegmentSize | undefined

	/** The horizontal/vertical resolution of the buttons */
	readonly ICON_SIZE: number
	/** The total number of pixels of a button */
	readonly ICON_PIXELS: number
	/** The number of bytes for a RGB encoded image for a button */
	readonly ICON_BYTES: number

	/** The horizontal spacing in pixels between each button */
	readonly KEY_SPACING_HORIZONTAL: number
	/** The vertical spacing in pixels between each button */
	readonly KEY_SPACING_VERTICAL: number

	/** The model of this device */
	readonly MODEL: DeviceModelId
	/** The name of the product/model */
	readonly PRODUCT_NAME: string

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
	 * Get information about the underlying HID device
	 */
	getHidDeviceInfo(): Promise<HIDDeviceInfo>

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
	 * Fills the lcd strip above an encoder
	 * @param {number} index The encoder to draw above
	 * @param {Buffer} imageBuffer The image to write
	 * @param {Object} sourceOptions Options to control the write
	 */
	fillEncoderLcd(index: EncoderIndex, imageBuffer: Buffer, sourceOptions: FillImageOptions): Promise<void>

	/**
	 * Fill a region of the lcd strip, ignoring the boundaries of the encoders
	 * @param {number} x The x position to draw to
	 * @param {number} y The y position to draw to
	 * @param {Buffer} imageBuffer The image to write
	 * @param {Object} sourceOptions Options to control the write
	 */
	fillLcdRegion(x: number, y: number, imageBuffer: Buffer, sourceOptions: FillLcdImageOptions): Promise<void>

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
}
