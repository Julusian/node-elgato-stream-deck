import type { EventEmitter } from 'eventemitter3'
import type { DeviceModelId, Dimension, EncoderIndex, KeyIndex } from './id.js'
import type { HIDDeviceInfo } from './hid-device.js'
import type {
	StreamDeckButtonControlDefinition,
	StreamDeckControlDefinition,
	StreamDeckEncoderControlDefinition,
	StreamDeckLcdSegmentControlDefinition,
} from './controlDefinition.js'

export interface StreamDeckTcpChildDeviceInfo extends HIDDeviceInfo {
	readonly model: DeviceModelId
	readonly serialNumber: string
	readonly tcpPort: number
}

export interface FillImageOptions {
	format: 'rgb' | 'rgba' | 'bgr' | 'bgra'
}
export interface FillPanelOptions extends FillImageOptions, FillPanelDimensionsOptions {}

export interface FillPanelDimensionsOptions {
	withPadding?: boolean
}

export interface FillLcdImageOptions extends FillImageOptions {
	width: number
	height: number
}

export interface LcdPosition {
	x: number
	y: number
}

export type StreamDeckEvents = {
	down: [control: StreamDeckButtonControlDefinition | StreamDeckEncoderControlDefinition]
	up: [control: StreamDeckButtonControlDefinition | StreamDeckEncoderControlDefinition]
	error: [err: unknown]
	rotate: [control: StreamDeckEncoderControlDefinition, amount: number]
	lcdShortPress: [control: StreamDeckLcdSegmentControlDefinition, position: LcdPosition]
	lcdLongPress: [control: StreamDeckLcdSegmentControlDefinition, position: LcdPosition]
	lcdSwipe: [control: StreamDeckLcdSegmentControlDefinition, from: LcdPosition, to: LcdPosition]

	nfcRead: [id: string]
}

export interface StreamDeck extends EventEmitter<StreamDeckEvents> {
	/** List of the controls on this streamdeck */
	readonly CONTROLS: Readonly<StreamDeckControlDefinition[]>

	// TODO: replace these with a definition on each button control which gives it a coordinate inside of the display
	// These are removed temporarily until this is done, to avoid this being another breaking change if it does want to change
	// /** The horizontal spacing in pixels between each button */
	// readonly KEY_SPACING_HORIZONTAL: number
	// /** The vertical spacing in pixels between each button */
	// readonly KEY_SPACING_VERTICAL: number

	/** The model of this device */
	readonly MODEL: DeviceModelId
	/** The name of the product/model */
	readonly PRODUCT_NAME: string

	/** Whether this device has a nfc reader */
	readonly HAS_NFC_READER: boolean

	/**
	 * Calculate the dimensions to use for `fillPanelBuffer`, to fill the whole button lcd panel with a single image.
	 * @param options Options to control the write
	 * @returns The dimensions to use for the image, or null if there is no panel
	 */
	calculateFillPanelDimensions(options?: FillPanelDimensionsOptions): Dimension | null

	/**
	 * Open the child device, if supported and connected
	 * If the child has already been opened, this will fail
	 * // nocommit fail by throwing or null?
	 */
	openChildDevice(): Promise<StreamDeck | null>

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
	fillKeyBuffer(
		keyIndex: KeyIndex,
		imageBuffer: Uint8Array | Uint8ClampedArray,
		options?: FillImageOptions,
	): Promise<void>

	/**
	 * Fills the whole panel with an image in a Buffer.
	 *
	 * @param {Buffer} imageBuffer The image to write
	 * @param {Object} options Options to control the write
	 */
	fillPanelBuffer(imageBuffer: Uint8Array | Uint8ClampedArray, options?: FillPanelOptions): Promise<void>

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
	 * Fills the primary led of an encoder
	 * @param {number} index The encoder to fill
	 * @param {number} r The color's red value. 0 - 255
	 * @param {number} g The color's green value. 0 - 255
	 * @param {number} b The color's blue value. 0 -255
	 */
	setEncoderColor(index: EncoderIndex, r: number, g: number, b: number): Promise<void>

	/**
	 * Fills the led ring of an encoder with a single color
	 * @param {number} index The encoder to fill
	 * @param {number} r The color's red value. 0 - 255
	 * @param {number} g The color's green value. 0 - 255
	 * @param {number} b The color's blue value. 0 -255
	 */
	setEncoderRingSingleColor(index: EncoderIndex, r: number, g: number, b: number): Promise<void>

	/**
	 * Fill the led ring of an encoder
	 * @param index The encoder to fill
	 * @param colors rgb packed pixel values for the encoder ring
	 */
	setEncoderRingColors(index: EncoderIndex, colors: number[] | Buffer | Uint8Array): Promise<void>

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
		imageBuffer: Uint8Array,
		sourceOptions: FillLcdImageOptions,
	): Promise<void>

	/**
	 * Clear the lcd segment to black
	 * @param {number} lcdIndex The id of the lcd segment to clear
	 */
	clearLcdSegment(lcdIndex: number): Promise<void>

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

	getChildDeviceInfo(): Promise<StreamDeckTcpChildDeviceInfo | null>
}
