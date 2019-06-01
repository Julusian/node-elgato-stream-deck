import { EventEmitter } from 'events'
import * as HID from 'node-hid'

import { DEVICE_MODELS, DeviceModel, DeviceModelId } from './models'
import { numberArrayToString } from './util'

export type KeyIndex = number

export interface StreamDeckDeviceInfo {
	model: DeviceModelId
	path: string
	serialNumber?: string
}

/*
 * The original StreamDeck uses packet sizes too larged for the hidraw driver which is
 * the default on linux. https://github.com/node-hid/node-hid/issues/249
 */
HID.setDriverType('libusb')

/**
 * List detected devices
 */
export function listStreamDecks(): StreamDeckDeviceInfo[] {
	const devices: StreamDeckDeviceInfo[] = []
	for (const dev of HID.devices()) {
		const model = DEVICE_MODELS.find(m => m.PRODUCT_ID === dev.productId)

		if (model && dev.vendorId === 0x0fd9 && dev.path) {
			devices.push({
				model: model.MODEL_ID,
				path: dev.path,
				serialNumber: dev.serialNumber
			})
		}
	}
	return devices
}

/**
 * Get the info of a device if the given path is a streamdeck
 */
export function getStreamDeckInfo(path: string): StreamDeckDeviceInfo | undefined {
	return listStreamDecks().find(dev => dev.path === path)
}

export class StreamDeck extends EventEmitter {
	get NUM_KEYS() {
		return this.deviceModel.NUM_KEYS
	}
	get KEY_COLUMNS() {
		return this.deviceModel.KEY_COLS
	}
	get KEY_ROWS() {
		return this.deviceModel.KEY_ROWS
	}

	/**
	 * The pixel size of an icon written to the Stream Deck key.
	 *
	 * @readonly
	 */
	get ICON_SIZE() {
		return this.deviceModel.IMAGE_SIZE
	}
	get ICON_BYTES() {
		return this.deviceModel.IMAGE_BYTES
	}

	get MODEL() {
		return this.deviceModel.MODEL_ID
	}

	/**
	 * Checks a value is a valid RGB value. A number between 0 and 255.
	 *
	 * @static
	 * @param {number} value The number to check
	 */
	public static checkRGBValue(value: number) {
		if (value < 0 || value > 255) {
			throw new TypeError('Expected a valid color RGB value 0 - 255')
		}
	}

	private device: HID.HID
	private deviceModel: DeviceModel
	private keyState: boolean[]
	private useOriginalKeyOrder: boolean

	constructor(devicePath?: string, useOriginalKeyOrder?: boolean) {
		super()

		let foundDevices = listStreamDecks()
		if (devicePath) {
			foundDevices = foundDevices.filter(d => d.path === devicePath)
		}

		if (foundDevices.length === 0) {
			if (devicePath) {
				throw new Error(`Device "${devicePath}" was not found`)
			} else {
				throw new Error('No Stream Decks are connected.')
			}
		}

		this.deviceModel = DEVICE_MODELS.find(m => m.MODEL_ID === foundDevices[0].model) as DeviceModel
		this.device = new HID.HID(foundDevices[0].path)
		this.useOriginalKeyOrder = !!useOriginalKeyOrder

		this.keyState = new Array(this.NUM_KEYS).fill(false)

		this.device.on('data', data => {
			// The first byte is a report ID, the last byte appears to be padding.
			// We strip these out for now.
			const offset = this.deviceModel.MODEL_ID === DeviceModelId.XL ? 4 : 1
			data = data.slice(offset, data.length - 1)

			for (let i = 0; i < this.NUM_KEYS; i++) {
				const keyPressed = Boolean(data[i])
				const keyIndex = this.horizontalFlipKeyIndex(i)
				const stateChanged = keyPressed !== this.keyState[keyIndex]
				if (stateChanged) {
					this.keyState[keyIndex] = keyPressed
					if (keyPressed) {
						this.emit('down', keyIndex)
					} else {
						this.emit('up', keyIndex)
					}
				}
			}
		})

		this.device.on('error', err => {
			this.emit('error', err)
		})
	}

	/**
	 * Checks a keyIndex is a valid key for a stream deck. A number between 0 and 14.
	 *
	 * @param {number} keyIndex The keyIndex to check
	 */
	public checkValidKeyIndex(keyIndex: KeyIndex) {
		if (keyIndex < 0 || keyIndex >= this.NUM_KEYS) {
			throw new TypeError(`Expected a valid keyIndex 0 - ${this.NUM_KEYS - 1}`)
		}
	}

	/**
	 * Fills the given key with a solid color.
	 *
	 * @param {number} keyIndex The key to fill 0 - 14
	 * @param {number} r The color's red value. 0 - 255
	 * @param {number} g The color's green value. 0 - 255
	 * @param {number} b The color's blue value. 0 -255
	 */
	public fillColor(keyIndex: KeyIndex, r: number, g: number, b: number) {
		this.checkValidKeyIndex(keyIndex)

		StreamDeck.checkRGBValue(r)
		StreamDeck.checkRGBValue(g)
		StreamDeck.checkRGBValue(b)

		const pixels = Buffer.alloc(this.ICON_BYTES, Buffer.from([r, g, b]))
		const keyIndex2 = this.horizontalFlipKeyIndex(keyIndex)
		this.fillImageRange(keyIndex2, pixels, 0, this.ICON_SIZE * 3)
	}

	/**
	 * Fills the given key with an image in a Buffer.
	 *
	 * @param {number} keyIndex The key to fill 0 - 14
	 * @param {Buffer} imageBuffer
	 */
	public fillImage(keyIndex: KeyIndex, imageBuffer: Buffer) {
		this.checkValidKeyIndex(keyIndex)

		if (imageBuffer.length !== this.ICON_BYTES) {
			throw new RangeError(`Expected image buffer of length ${this.ICON_BYTES}, got length ${imageBuffer.length}`)
		}

		const keyIndex2 = this.horizontalFlipKeyIndex(keyIndex)
		this.fillImageRange(keyIndex2, imageBuffer, 0, this.ICON_SIZE * 3)
	}

	/**
	 * Fills the whole panel with an image in a Buffer.
	 *
	 * @param {Buffer} imageBuffer
	 */
	public fillPanel(imageBuffer: Buffer) {
		if (imageBuffer.length !== this.ICON_BYTES * this.NUM_KEYS) {
			throw new RangeError(
				`Expected image buffer of length ${this.ICON_BYTES * this.NUM_KEYS}, got length ${imageBuffer.length}`
			)
		}

		for (let row = 0; row < this.KEY_ROWS; row++) {
			for (let column = 0; column < this.KEY_COLUMNS; column++) {
				const index = row * this.KEY_COLUMNS + this.KEY_COLUMNS - column - 1

				const stride = this.ICON_SIZE * 3 * this.KEY_COLUMNS
				const rowOffset = stride * row * this.ICON_SIZE
				const colOffset = column * this.ICON_SIZE * 3

				this.fillImageRange(index, imageBuffer, rowOffset + colOffset, stride)
			}
		}
	}

	/**
	 * Clears the given key.
	 *
	 * @param {number} keyIndex The key to clear 0 - 14
	 */
	public clearKey(keyIndex: KeyIndex) {
		this.checkValidKeyIndex(keyIndex)
		return this.fillColor(keyIndex, 0, 0, 0)
	}

	/**
	 * Clears all keys.
	 */
	public clearAllKeys() {
		for (let keyIndex = 0; keyIndex < this.NUM_KEYS; keyIndex++) {
			this.clearKey(keyIndex)
		}
	}

	/**
	 * Sets the brightness of the keys on the Stream Deck
	 *
	 * @param {number} percentage The percentage brightness
	 */
	public setBrightness(percentage: number) {
		if (percentage < 0 || percentage > 100) {
			throw new RangeError('Expected brightness percentage to be between 0 and 100')
		}

		if (this.deviceModel.MODEL_ID === DeviceModelId.XL) {
			// prettier-ignore
			const brightnessCommandBuffer = [
				0x03, 0x08, percentage, 0x00, 0x00, 0x00, 0x00, 0x00,
				0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
				0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
				0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
			]
			this.device.sendFeatureReport(brightnessCommandBuffer)
		} else {
			// prettier-ignore
			const brightnessCommandBuffer = [
				0x05, 0x55, 0xaa, 0xd1, 0x01, percentage, 0x00, 0x00,
				0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
				0x00
			]
			this.device.sendFeatureReport(brightnessCommandBuffer)
		}
	}

	/**
	 * Resets the display to the startup logo
	 */
	public resetToLogo() {
		// TODO - test for XL
		// prettier-ignore
		const resetCommandBuffer = [
			0x0B, 0x63, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00
		]
		this.device.sendFeatureReport(resetCommandBuffer)
	}

	/**
	 * Get firmware version from Stream Deck
	 */
	public getFirmwareVersion() {
		// TODO - fix for XL
		return numberArrayToString(this.device.getFeatureReport(4, 17).slice(5))
	}

	/**
	 * Get serial number from Stream Deck
	 */
	public getSerialNumber() {
		// TODO - fix for XL
		return numberArrayToString(this.device.getFeatureReport(3, 17).slice(5))
	}

	private horizontalFlipKeyIndex(keyIndex: KeyIndex): KeyIndex {
		if (!this.useOriginalKeyOrder && this.deviceModel.KEY_DIRECTION === 'rtl') {
			// Horizontal flip
			const half = (this.KEY_COLUMNS - 1) / 2
			const diff = ((keyIndex % this.KEY_COLUMNS) - half) * -half
			return keyIndex + diff
		} else {
			return keyIndex
		}
	}

	private fillImageRange(keyIndex: KeyIndex, imageBuffer: Buffer, sourceOffset: number, sourceStride: number) {
		this.checkValidKeyIndex(keyIndex)

		const packets = this.deviceModel.generateFillImageWrites(keyIndex, imageBuffer, sourceOffset, sourceStride)
		for (const packet of packets) {
			this.device.write(packet)
		}
	}
}
