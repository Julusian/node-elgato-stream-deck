import { DeviceModelId, KeyIndex, StreamDeck, FillImageOptions, FillPanelOptions } from './models'

/**
 * A minimal proxy around a StreamDeck instance.
 * This is intended to be used by libraries wrapping this that want to add more methods to the StreamDeck
 */
export class StreamDeckProxy implements StreamDeck {
	protected device: StreamDeck

	constructor(device: StreamDeck) {
		this.device = device
	}

	public get NUM_KEYS(): number {
		return this.device.NUM_KEYS
	}
	public get KEY_COLUMNS(): number {
		return this.device.KEY_COLUMNS
	}
	public get KEY_ROWS(): number {
		return this.device.KEY_ROWS
	}
	public get ICON_SIZE(): number {
		return this.device.ICON_SIZE
	}
	public get ICON_BYTES(): number {
		return this.device.ICON_BYTES
	}
	public get ICON_PIXELS(): number {
		return this.device.ICON_PIXELS
	}
	public get MODEL(): DeviceModelId {
		return this.device.MODEL
	}

	public checkValidKeyIndex(keyIndex: KeyIndex): void {
		this.device.checkValidKeyIndex(keyIndex)
	}

	public close(): Promise<void> {
		return this.device.close()
	}
	public fillKeyColor(keyIndex: KeyIndex, r: number, g: number, b: number): Promise<void> {
		return this.device.fillKeyColor(keyIndex, r, g, b)
	}
	public fillKeyBuffer(keyIndex: KeyIndex, imageBuffer: Buffer, options?: FillImageOptions): Promise<void> {
		return this.device.fillKeyBuffer(keyIndex, imageBuffer, options)
	}
	public fillPanelBuffer(imageBuffer: Buffer, options?: FillPanelOptions): Promise<void> {
		return this.device.fillPanelBuffer(imageBuffer, options)
	}
	public clearKey(keyIndex: KeyIndex): Promise<void> {
		return this.device.clearKey(keyIndex)
	}
	public clearPanel(): Promise<void> {
		return this.device.clearPanel()
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

	public on(...args: Parameters<StreamDeck['on']>): StreamDeckProxy {
		this.device.on(...args)
		return this
	}
}
