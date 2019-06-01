// tslint:disable-next-line: no-submodule-imports
import { mocked } from 'ts-jest/utils'
import { readFixtureJSON } from './helpers'

const iconSize = 96

describe('jpeg-library', () => {
	beforeEach(() => {
		jest.resetModules()
	})

	test('ensure falls back to jpeg-js when jpeg-turbo exceptions', async () => {
		const img = Buffer.from(readFixtureJSON('fillImage-sample-icon-96.json'))

		// Mock jpeg-turbo so that we can make it crash
		jest.mock('jpeg-turbo')
		const jpegTurbo = require('jpeg-turbo')
		mocked(jpegTurbo.bufferSize).mockImplementation(() => 1000)
		mocked(jpegTurbo.compressSync).mockImplementation(() => {
			throw new Error('something failed')
		})

		// Mock jpeg-js so we can see that it got used instead of jpeg-turbo
		jest.doMock('jpeg-js')
		const jpegJS = require('jpeg-js')
		mocked(jpegJS.encode).mockImplementation(() => ({ data: Buffer.alloc(100) }))

		const { encodeJPEG } = require('../jpeg')

		const encoded = encodeJPEG(img, iconSize, iconSize)
		expect(encoded).toBeTruthy()
		expect(encoded).toHaveLength(100)
	})

	test('ensure falls back to jpeg-js when jpeg-turbo is not available', async () => {
		const img = Buffer.from(readFixtureJSON('fillImage-sample-icon-96.json'))

		// Mock jpeg-turbo so that we can make it appear not installed
		jest.doMock('jpeg-turbo', null)

		// Mock jpeg-js so we can see that it got used instead of jpeg-turbo
		jest.doMock('jpeg-js')
		const jpegJS = require('jpeg-js')
		mocked(jpegJS.encode).mockImplementation(() => ({ data: Buffer.alloc(100) }))

		const { encodeJPEG } = require('../jpeg')

		const encoded = encodeJPEG(img, iconSize, iconSize)
		expect(encoded).toBeTruthy()
		expect(encoded).toHaveLength(100)
	})
})
