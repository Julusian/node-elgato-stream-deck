import { transformImageBuffer } from '../util.js'

function getSimpleBuffer(width: number, height: number, components: 3 | 4): Buffer {
	const buf = Buffer.alloc(width * height * components)
	for (let i = 0; i < buf.length; i++) {
		buf[i] = i
	}
	return buf
}
describe('imageToByteArray', () => {
	test('basic rgb -> rgba', () => {
		const srcBuffer = getSimpleBuffer(2, 2, 3)
		const res = transformImageBuffer(
			srcBuffer,
			{ format: 'rgb', offset: 0, stride: 2 * 3 },
			{ colorMode: 'rgba' },
			5,
			2,
			2,
			undefined,
		)
		expect(res).toMatchSnapshot()
	})
	test('basic rgb -> bgr', () => {
		const srcBuffer = getSimpleBuffer(2, 2, 3)
		const res = transformImageBuffer(
			srcBuffer,
			{ format: 'rgb', offset: 0, stride: 2 * 3 },
			{ colorMode: 'bgr' },
			4,
			2,
			2,
			undefined,
		)
		expect(res).toMatchSnapshot()
	})
	test('basic bgra -> bgr', () => {
		const srcBuffer = getSimpleBuffer(2, 2, 4)
		const res = transformImageBuffer(
			srcBuffer,
			{ format: 'bgra', offset: 0, stride: 2 * 4 },
			{ colorMode: 'bgr' },
			4,
			2,
			2,
			undefined,
		)
		expect(res).toMatchSnapshot()
	})
	test('basic bgra -> rgba', () => {
		const srcBuffer = getSimpleBuffer(2, 2, 4)
		const res = transformImageBuffer(
			srcBuffer,
			{ format: 'bgra', offset: 0, stride: 2 * 4 },
			{ colorMode: 'rgba' },
			4,
			2,
			2,
			undefined,
		)
		expect(res).toMatchSnapshot()
	})

	test('basic vflip', () => {
		const srcBuffer = getSimpleBuffer(3, 3, 3)
		const res = transformImageBuffer(
			srcBuffer,
			{ format: 'bgr', offset: 0, stride: 3 * 3 },
			{ colorMode: 'bgr', yFlip: true },
			4,
			3,
			3,
			undefined,
		)
		expect(res).toMatchSnapshot()
	})

	test('basic xflip', () => {
		const srcBuffer = getSimpleBuffer(3, 3, 3)
		const res = transformImageBuffer(
			srcBuffer,
			{ format: 'bgr', offset: 0, stride: 3 * 3 },
			{ colorMode: 'bgr', xFlip: true },
			4,
			3,
			3,
			undefined,
		)
		expect(res).toMatchSnapshot()
	})

	test('non-square rotation', () => {
		const srcBuffer = getSimpleBuffer(4, 1, 3)
		const res = transformImageBuffer(
			srcBuffer,
			{ format: 'bgr', offset: 0, stride: 4 * 3 },
			{ colorMode: 'bgr', rotate: true },
			4,
			4,
			1,
			undefined,
		)
		expect(res).toMatchSnapshot()
	})

	test('non-square rotation with flip', () => {
		const srcBuffer = getSimpleBuffer(4, 1, 3)
		const res = transformImageBuffer(
			srcBuffer,
			{ format: 'bgr', offset: 0, stride: 4 * 3 },
			{ colorMode: 'bgr', rotate: true, xFlip: true },
			4,
			4,
			1,
			undefined,
		)
		expect(res).toMatchSnapshot()
	})

	describe('padding', () => {
		const padding = { left: 1, top: 1, right: 2, bottom: 0 }

		test('places the image inside a black border', () => {
			const res = transformImageBuffer(
				new Uint8Array([1, 1, 1, 2, 2, 2]),
				{ format: 'bgr', offset: 0, stride: 2 * 3 },
				{ colorMode: 'bgr' },
				0,
				2,
				1,
				padding,
			)
			// prettier-ignore
			expect(res).toEqual(new Uint8Array([
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 1, 1, 1, 2, 2, 2, 0, 0, 0, 0, 0, 0,
			]))
		})

		test('applies flips to the padded image', () => {
			const res = transformImageBuffer(
				new Uint8Array([1, 1, 1, 2, 2, 2]),
				{ format: 'bgr', offset: 0, stride: 2 * 3 },
				{ colorMode: 'bgr', xFlip: true, yFlip: true },
				0,
				2,
				1,
				padding,
			)
			// prettier-ignore
			expect(res).toEqual(new Uint8Array([
				0, 0, 0, 0, 0, 0, 2, 2, 2, 1, 1, 1, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			]))
		})

		test('padding is opaque for rgba', () => {
			const res = transformImageBuffer(
				new Uint8Array([9, 9, 9]),
				{ format: 'rgb', offset: 0, stride: 3 },
				{ colorMode: 'rgba' },
				0,
				1,
				1,
				{ left: 1, top: 0, right: 0, bottom: 0 },
			)
			expect(res).toEqual(new Uint8Array([0, 0, 0, 255, 9, 9, 9, 255]))
		})
	})
})
