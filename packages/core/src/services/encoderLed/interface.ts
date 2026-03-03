import type { EncoderIndex } from '../../id.js'

export interface EncoderLedService {
	clearAll(): Promise<void>

	setEncoderColor(encoder: EncoderIndex, red: number, green: number, blue: number): Promise<void>

	setEncoderRingSingleColor(encoder: EncoderIndex, red: number, green: number, blue: number): Promise<void>

	setEncoderRingColors(encoder: EncoderIndex, colors: number[] | Uint8Array): Promise<void>
}
