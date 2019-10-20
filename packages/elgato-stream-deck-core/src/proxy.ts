import { KeyIndex, StreamDeck } from './models'

export class StreamDeckProxy implements StreamDeck {
	protected device: StreamDeck

	constructor(device: StreamDeck) {
		this.device = device
	}

	public get NUM_KEYS() {
		return this.device.NUM_KEYS
	}
	public get KEY_COLUMNS() {
		return this.device.KEY_COLUMNS
	}
	public get KEY_ROWS() {
		return this.device.KEY_ROWS
	}
	public get ICON_SIZE() {
		return this.device.ICON_SIZE
	}
	public get ICON_BYTES() {
		return this.device.ICON_BYTES
	}
	public get MODEL() {
		return this.device.MODEL
	}

	public checkValidKeyIndex(keyIndex: KeyIndex) {
		this.device.checkValidKeyIndex(keyIndex)
	}

	public close(): Promise<void> {
		return this.device.close()
	}
	public fillColor(keyIndex: KeyIndex, r: number, g: number, b: number): Promise<void> {
		return this.device.fillColor(keyIndex, r, g, b)
	}
	public fillImage(keyIndex: KeyIndex, imageBuffer: Buffer): Promise<void> {
		return this.device.fillImage(keyIndex, imageBuffer)
	}
	public fillPanel(imageBuffer: Buffer): Promise<void> {
		return this.device.fillPanel(imageBuffer)
	}
	public clearKey(keyIndex: KeyIndex): Promise<void> {
		return this.device.clearKey(keyIndex)
	}
	public clearAllKeys(): Promise<void> {
		return this.device.clearAllKeys()
	}
	public setBrightness(percentage: number): Promise<void> {
		return this.device.setBrightness(percentage)
	}
	public resetToLogo(): Promise<void> {
		return this.device.resetToLogo()
	}
	public getFirmwareVersion(): Promise<string> {
		return this.device.getFirmwareVersion()
	}
	public getSerialNumber(): Promise<string> {
		return this.device.getSerialNumber()
	}

	public on(event: 'down' | 'up', listener: (keyIndex: KeyIndex) => void): any
	public on(event: 'error', listener: (e: any) => void): any
	public on(event: any, listener: any) {
		return this.device.on(event, listener)
	}
}
