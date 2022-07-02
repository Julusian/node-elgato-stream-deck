// Hack to get WebAssembly importable until https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/826
/// <reference lib="dom" />

import * as path from 'path'
import * as fs from 'fs'

import { InternalFillImageOptions } from '../models/base'
import { FillImageTargetOptions } from './options'

const imports = {}
let wasm: any = undefined

let cachegetUint8Memory0: Uint8Array | null = null
function getUint8Memory0() {
	if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
		cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer)
	}
	return cachegetUint8Memory0
}

export function wasmImageToByteArray(
	imageBuffer: Uint8Array,
	sourceOptions: InternalFillImageOptions,
	targetOptions: FillImageTargetOptions,
	destPadding: number,
	imageSize: number
): Uint8Array {
	/**
	 * This is based on what is given by wasm-pack, but has been adapted for better performance.
	 * A lot of time was being spent on copying Buffers into wasm memory.
	 *
	 * We want to support taking subregions of the input Buffer/image. But with the default wrapping that would
	 * result in copying in the full image every call. Or we could copy into a smaller buffer first, but that would
	 * result in two copies. We can optimise away this excessive copying and keep it down at one copy.
	 *
	 * We know that the input value of dest is not interesting to wasm, so we can skip copying that
	 *
	 * Strings have been avoided, as they also incur an overhead
	 */

	const destLen = imageSize * imageSize * targetOptions.colorMode.length
	const byteBuffer = Buffer.alloc(destPadding + destLen)

	const srcFormatLen = sourceOptions.format.length
	const srcLen = imageSize * imageSize * srcFormatLen

	const flipColours = sourceOptions.format.substring(0, 3) !== targetOptions.colorMode.substring(0, 3)

	let destPtr: any

	try {
		const srcPtr = wasm.__wbindgen_malloc(srcLen)

		// Copy in the image subregion
		const memory = getUint8Memory0()
		const row_len = imageSize * srcFormatLen
		if (sourceOptions.stride === row_len) {
			// stride is a row, so we can take a shortcut
			memory.set(imageBuffer.subarray(sourceOptions.offset, sourceOptions.offset + row_len * imageSize), 0)
		} else {
			// stride is more than a row, so we need to copy line by line
			for (let y = 0; y < imageSize; y++) {
				const row_start_src = y * sourceOptions.stride + sourceOptions.offset

				memory.set(imageBuffer.subarray(row_start_src, row_start_src + row_len), y * row_len)
			}
		}

		destPtr = wasm.__wbindgen_malloc(destLen)

		wasmFunction(
			srcPtr,
			srcLen,
			destPtr,
			destLen,
			srcFormatLen,
			targetOptions.colorMode.length,
			flipColours,
			targetOptions.xFlip ?? false,
			targetOptions.yFlip ?? false,
			targetOptions.rotate ?? false,
			imageSize
		)

		// Copy the result into the buffer
		byteBuffer.set(getUint8Memory0().subarray(destPtr, destPtr + destLen), destPadding)
	} finally {
		// srcPtr is freed by the wasm binary

		wasm.__wbindgen_free(destPtr, destLen)
	}

	return byteBuffer
}

function wasmFunction(
	srcPtr: unknown,
	srcLen: number,
	destPtr: unknown,
	destLen: number,
	src_format_len: number,
	dest_format_len: number,
	flip_colours: boolean,
	x_flip: boolean,
	y_flip: boolean,
	rotate: boolean,
	image_size: number
): void {
	// Dange: the following call needs to match the rust implementation
	wasm.image_to_byte_array(
		srcPtr,
		srcLen,
		destPtr,
		destLen,
		src_format_len,
		dest_format_len,
		flip_colours,
		x_flip,
		y_flip,
		rotate,
		image_size
	)
}

const wasmPath = path.join(__dirname, '../../../../wasm/pkg/streamdeck_wasm_bg.wasm')
const wasmBytes = fs.readFileSync(wasmPath)

const wasmModule = new WebAssembly.Module(wasmBytes)
const wasmInstance = new WebAssembly.Instance(wasmModule, imports)
wasm = wasmInstance.exports
module.exports.__wasm = wasm
