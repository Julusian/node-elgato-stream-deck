/* eslint-disable @typescript-eslint/no-require-imports */

import { mocked } from 'jest-mock'
import { readFixtureJSON } from './helpers.js'
import type * as TjpegJs from 'jpeg-js'
import type * as Tjpeg from '../jpeg.js'

const iconSize = 96

describe('jpeg-encoding', () => {
	function addAlphaChannel(raw: Buffer): Buffer {
		const pixels = raw.length / 3
		const res = Buffer.alloc(pixels * 4)

		for (let i = 0; i < pixels; i++) {
			res.set(raw.subarray(i * 3, i * 3 + 3), i * 4)
		}

		return res
	}

	test('jpeg-turbo: encoded successfully', async () => {
		const img = addAlphaChannel(readFixtureJSON('fillImage-sample-icon-96.json'))

		// Mock jpeg-js so we can see if it got used instead of jpeg-turbo
		jest.doMock('jpeg-js')
		const jpegJS: typeof TjpegJs = require('jpeg-js')
		mocked(jpegJS.encode).mockImplementation((src) => ({ ...src, data: Buffer.alloc(100) }))

		const { encodeJPEG } = require('../jpeg.js') as typeof Tjpeg

		const encoded = await encodeJPEG(img, iconSize, iconSize, undefined)
		expect(encoded).toBeTruthy()

		// Check it looks like it has been encoded
		expect(encoded.length).toBeLessThan(9000)
		expect(encoded.length).toBeGreaterThan(3000)
	})

	test('jpeg-js: encoded successfully', async () => {
		const img = addAlphaChannel(readFixtureJSON('fillImage-sample-icon-96.json'))

		// Ensure real jpeg-js is enabled
		const jpegJS: typeof TjpegJs = require('jpeg-js')
		mocked(jpegJS.encode).mockImplementation(jest.requireActual('jpeg-js').encode)

		jest.doMock('@julusian/jpeg-turbo', undefined)
		const { encodeJPEG } = require('../jpeg.js') as typeof Tjpeg

		const encoded = await encodeJPEG(img, iconSize, iconSize, undefined)
		expect(encoded).toBeTruthy()

		// Check it looks like it has been encoded
		expect(encoded.length).toBeLessThan(9000)
		expect(encoded.length).toBeGreaterThan(3000)
	})
})
