/* eslint-disable node/no-unpublished-require */
const { imageToByteArray } = require('./packages/core/dist/util')
const wasm = require('./wasm/pkg/streamdeck_wasm')

const buf = Buffer.alloc(72 * 72 * 4)

for (let aaa = 0; aaa < 10; aaa++) {
	const count = 1000
	let v
	const start = Date.now()
	for (let i = 0; i < count; i++) {
		v = imageToByteArray(
			buf,
			{
				format: 'rgba',
				offset: 0,
				stride: 72 * 3,
			},
			{
				colorMode: 'bgr',
				rotate: true,
				xFlip: true,
				yFlip: true,
			},
			0,
			72
		)
	}
	const done = Date.now()
	console.log(`js took: ${done - start}ms over ${count} samples`)

	const start2 = Date.now()
	for (let i = 0; i < count; i++) {
		const b = Buffer.alloc(72 * 72 * 3)
		v = wasm.hello(buf, b, 'rgba', 72 * 3, 0, 'bgr', 0, true, true, true, 72)
	}
	const done2 = Date.now()
	console.log(`wasm took: ${done2 - start2}ms over ${count} samples`)
}
