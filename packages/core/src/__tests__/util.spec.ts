import { transformImageBuffer } from '../util'

function getSimpleBuffer(dim: number, components: 3 | 4): Buffer {
	const buf = Buffer.alloc(dim * dim * components)
	for (let i = 0; i < buf.length; i++) {
		buf[i] = i
	}
	return buf
}
describe('imageToByteArray', () => {
	test('basic rgb -> rgba', () => {
		const srcBuffer = getSimpleBuffer(2, 3)
		const res = transformImageBuffer(
			srcBuffer,
			{ format: 'rgb', offset: 0, stride: 2 * 3 },
			{ colorMode: 'rgba' },
			5,
			2,
			2
		)
		expect(res).toMatchSnapshot()
	})
	test('basic rgb -> bgr', () => {
		const srcBuffer = getSimpleBuffer(2, 3)
		const res = transformImageBuffer(
			srcBuffer,
			{ format: 'rgb', offset: 0, stride: 2 * 3 },
			{ colorMode: 'bgr' },
			4,
			2,
			2
		)
		expect(res).toMatchSnapshot()
	})
	test('basic bgra -> bgr', () => {
		const srcBuffer = getSimpleBuffer(2, 4)
		const res = transformImageBuffer(
			srcBuffer,
			{ format: 'bgra', offset: 0, stride: 2 * 4 },
			{ colorMode: 'bgr' },
			4,
			2,
			2
		)
		expect(res).toMatchSnapshot()
	})
	test('basic bgra -> rgba', () => {
		const srcBuffer = getSimpleBuffer(2, 4)
		const res = transformImageBuffer(
			srcBuffer,
			{ format: 'bgra', offset: 0, stride: 2 * 4 },
			{ colorMode: 'rgba' },
			4,
			2,
			2
		)
		expect(res).toMatchSnapshot()
	})

	test('basic vflip', () => {
		const srcBuffer = getSimpleBuffer(3, 3)
		const res = transformImageBuffer(
			srcBuffer,
			{ format: 'bgr', offset: 0, stride: 3 * 3 },
			{ colorMode: 'bgr', yFlip: true },
			4,
			3,
			3
		)
		expect(res).toMatchSnapshot()
	})

	test('basic xflip', () => {
		const srcBuffer = getSimpleBuffer(3, 3)
		const res = transformImageBuffer(
			srcBuffer,
			{ format: 'bgr', offset: 0, stride: 3 * 3 },
			{ colorMode: 'bgr', xFlip: true },
			4,
			3,
			3
		)
		expect(res).toMatchSnapshot()
	})
})
