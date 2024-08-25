import type { Dimension } from '../../id.js'
import type { ButtonsLcdDisplayService } from './interface.js'
import type { FillPanelDimensionsOptions, FillImageOptions, FillPanelOptions } from '../../types.js'

export class PedalLcdService implements ButtonsLcdDisplayService {
	public calculateFillPanelDimensions(_options?: FillPanelDimensionsOptions): Dimension | null {
		// Not supported
		return null
	}
	public async clearKey(_keyIndex: number): Promise<void> {
		// Not supported
	}
	public async clearPanel(): Promise<void> {
		// Not supported
	}
	public async fillKeyColor(_keyIndex: number, _r: number, _g: number, _b: number): Promise<void> {
		// Not supported
	}
	public async fillKeyBuffer(
		_keyIndex: number,
		_imageBuffer: Uint8Array,
		_options?: FillImageOptions,
	): Promise<void> {
		// Not supported
	}
	public async fillPanelBuffer(_imageBuffer: Uint8Array, _options?: FillPanelOptions): Promise<void> {
		// Not supported
	}
}
