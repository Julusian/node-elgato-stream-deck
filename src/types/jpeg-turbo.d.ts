declare module 'jpeg-turbo' {
	export type Format = number
	export const FORMAT_RGB: Format
	export const FORMAT_BGR: Format
	export const FORMAT_RGBX: Format
	export const FORMAT_BGRX: Format
	export const FORMAT_XRGB: Format
	export const FORMAT_XBGR: Format
	export const FORMAT_GRAY: Format
	export const FORMAT_RGBA: Format
	export const FORMAT_BGRA: Format
	export const FORMAT_ABGR: Format
	export const FORMAT_ARGB: Format

	export type SubSampling = number
	export const SAMP_444: SubSampling
	export const SAMP_422: SubSampling
	export const SAMP_420: SubSampling
	export const SAMP_GRAY: SubSampling
	export const SAMP_440: SubSampling

	export interface EncodeOptions {
		format: Format
		width: number
		height: number
		subsampling?: SubSampling
		quality?: number
	}

	export function bufferSize(options: EncodeOptions): number
	export function compressSync(raw: Buffer, preallocatedOut: Buffer | undefined, options: EncodeOptions): Buffer

	export interface DecodeOptions {
		format: Format
	}
	export interface DecodeResult {
		data: Buffer
		width: number
		height: number
		subsampling: any
		bpp: number
	}

	export function decompressSync(
		image: Buffer,
		preallocatedOut: Buffer | undefined,
		options: DecodeOptions
	): DecodeResult
}
