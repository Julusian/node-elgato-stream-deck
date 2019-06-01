// tslint:disable-next-line: no-submodule-imports
import { mocked } from 'ts-jest/utils'
import { readFixtureJSON } from './helpers'

const iconSize = 96

describe('jpeg-encoding', () => {
	beforeEach(() => {
		// jest.resetModules()
	})

	test('jpeg-turbo: encoded successfully', async () => {
		const img = Buffer.from(readFixtureJSON('fillImage-sample-icon-96.json'))

		// Mock jpeg-js so we can see if it got used instead of jpeg-turbo
		jest.doMock('jpeg-js')
		const jpegJS = require('jpeg-js')
		mocked(jpegJS.encode).mockImplementation(() => ({ data: Buffer.alloc(100) }))

		const { encodeJPEG } = require('../jpeg')

		const encoded = encodeJPEG(img, iconSize, iconSize)
		expect(encoded).toBeTruthy()

		// Check it looks like it has been encoded
		expect(encoded.length).toBeLessThan(9000)
		expect(encoded.length).toBeGreaterThan(7000)
	})

	test('jpeg-js: encoded successfully', async () => {
		const img = Buffer.from(readFixtureJSON('fillImage-sample-icon-96.json'))

		jest.doMock('jpeg-turbo', null)
		const { encodeJPEG } = require('../jpeg')

		const encoded = encodeJPEG(img, iconSize, iconSize)
		expect(encoded).toBeTruthy()

		// Check it looks like it has been encoded
		expect(encoded.length).toBeLessThan(9000)
		expect(encoded.length).toBeGreaterThan(7000)
	})
})
