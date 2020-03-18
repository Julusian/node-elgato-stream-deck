import { imageToByteArray } from '../util'

function getSimpleBuffer(dim: number, components: 3 | 4) {
	const buf = Buffer.alloc(dim * dim * components)
	for (let i = 0; i < buf.length; i++) {
		buf[i] = i
	}
	return buf
}
describe('imageToByteArray', () => {
	test('basic rgb -> rgba', () => {
		const srcBuffer = getSimpleBuffer(2, 3)
		const res = imageToByteArray(
			srcBuffer,
			{ format: 'rgb', offset: 0, stride: 2 * 3 },
			5,
			(x, y) => ({ x, y }),
			'rgba',
			2
		)
		expect(res).toMatchSnapshot()
	})
	test('basic rgb -> bgr', () => {
		const srcBuffer = getSimpleBuffer(2, 3)
		const res = imageToByteArray(
			srcBuffer,
			{ format: 'rgb', offset: 0, stride: 2 * 3 },
			4,
			(x, y) => ({ x, y }),
			'bgr',
			2
		)
		expect(res).toMatchSnapshot()
	})
	test('basic bgra -> bgr', () => {
		const srcBuffer = getSimpleBuffer(2, 4)
		const res = imageToByteArray(
			srcBuffer,
			{ format: 'bgra', offset: 0, stride: 2 * 4 },
			4,
			(x, y) => ({ x, y }),
			'bgr',
			2
		)
		expect(res).toMatchSnapshot()
	})
	test('basic bgra -> rgba', () => {
		const srcBuffer = getSimpleBuffer(2, 4)
		const res = imageToByteArray(
			srcBuffer,
			{ format: 'bgra', offset: 0, stride: 2 * 4 },
			4,
			(x, y) => ({ x, y }),
			'rgba',
			2
		)
		expect(res).toMatchSnapshot()
	})

	test('basic vflip', () => {
		const srcBuffer = getSimpleBuffer(3, 3)
		const res = imageToByteArray(
			srcBuffer,
			{ format: 'bgr', offset: 0, stride: 3 * 3 },
			4,
			(x, y) => ({ x, y: 2 - y }),
			'bgr',
			3
		)
		expect(res).toMatchSnapshot()
	})

	test('basic xflip', () => {
		const srcBuffer = getSimpleBuffer(3, 3)
		const res = imageToByteArray(
			srcBuffer,
			{ format: 'bgr', offset: 0, stride: 3 * 3 },
			4,
			(x, y) => ({ x: 2 - x, y }),
			'bgr',
			3
		)
		expect(res).toMatchSnapshot()
	})
})
