// TODO - can this be done more efficient?
export function dropAlpha(rawBuffer: Uint8ClampedArray | Buffer): Buffer {
	const pixels = rawBuffer.length / 4
	const res = Buffer.alloc(pixels * 3)
	for (let i = 0; i < pixels; i++) {
		const o = i * 4
		const p = i * 3

		res[p] = rawBuffer[o]
		res[p + 1] = rawBuffer[o + 1]
		res[p + 2] = rawBuffer[o + 2]
		res[p + 3] = rawBuffer[o + 3]
	}

	return res
}
