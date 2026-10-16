import type { EncoderIndex } from '../../id.js'

export interface EncoderLedService {
	clearAll(signal: AbortSignal | null): Promise<boolean>

	setEncoderColor(
		encoder: EncoderIndex,
		red: number,
		green: number,
		blue: number,
		signal: AbortSignal | null,
	): Promise<boolean>

	setEncoderRingSingleColor(
		encoder: EncoderIndex,
		red: number,
		green: number,
		blue: number,
		signal: AbortSignal | null,
	): Promise<boolean>

	setEncoderRingColors(
		encoder: EncoderIndex,
		colors: number[] | Uint8Array,
		signal: AbortSignal | null,
	): Promise<boolean>
}
