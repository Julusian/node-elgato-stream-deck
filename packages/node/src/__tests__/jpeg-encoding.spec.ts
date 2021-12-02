/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { mocked } from 'ts-jest/utils'
import { readFixtureJSON } from './helpers'

const iconSize = 96

describe('jpeg-encoding', () => {
	beforeEach(() => {
		// jest.resetModules()
	})

	function addAlphaChannel(raw: Buffer): Buffer {
		const pixels = raw.length / 3
		const res = Buffer.alloc(pixels * 4)

		for (let i = 0; i < pixels; i++) {
			res.set(raw.slice(i * 3, i * 3 + 3), i * 4)
		}

		return res
	}

	test('jpeg-turbo: encoded successfully', async () => {
		const img = addAlphaChannel(readFixtureJSON('fillImage-sample-icon-96.json'))

		// Mock jpeg-js so we can see if it got used instead of jpeg-turbo
		jest.doMock('jpeg-js')
		const jpegJS: typeof import('jpeg-js') = require('jpeg-js')
		mocked(jpegJS.encode).mockImplementation((src) => ({ ...src, data: Buffer.alloc(100) }))

		const { encodeJPEG } = require('../jpeg') as typeof import('../jpeg')

		const encoded = await encodeJPEG(img, iconSize, iconSize, undefined)
		expect(encoded).toBeTruthy()

		// Check it looks like it has been encoded
		expect(encoded.length).toBeLessThan(9000)
		expect(encoded.length).toBeGreaterThan(3000)
	})

	test('jpeg-js: encoded successfully', async () => {
		const img = addAlphaChannel(readFixtureJSON('fillImage-sample-icon-96.json'))

		jest.doMock('@julusian/jpeg-turbo', undefined)
		const { encodeJPEG } = require('../jpeg') as typeof import('../jpeg')

		const encoded = await encodeJPEG(img, iconSize, iconSize, undefined)
		expect(encoded).toBeTruthy()

		// Check it looks like it has been encoded
		expect(encoded.length).toBeLessThan(9000)
		expect(encoded.length).toBeGreaterThan(3000)
	})
})
