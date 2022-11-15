/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { mocked } from 'jest-mock'
import { readFixtureJSON } from './helpers'

const iconSize = 96

describe('jpeg-library', () => {
	beforeEach(() => {
		jest.resetModules()
	})

	test('ensure falls back to jpeg-js when jpeg-turbo exceptions', async () => {
		const img = readFixtureJSON('fillImage-sample-icon-96.json')

		// Mock jpeg-turbo so that we can make it crash
		jest.mock('@julusian/jpeg-turbo')
		const jpegTurbo: typeof import('@julusian/jpeg-turbo') = require('@julusian/jpeg-turbo')
		mocked(jpegTurbo.bufferSize).mockImplementation(() => 1000)
		mocked(jpegTurbo.compressSync).mockImplementation(() => {
			throw new Error('something failed')
		})

		// Mock jpeg-js so we can see that it got used instead of jpeg-turbo
		jest.doMock('jpeg-js')
		const jpegJS: typeof import('jpeg-js') = require('jpeg-js')
		mocked(jpegJS.encode).mockImplementation((src) => ({ ...src, data: Uint8Array.alloc(100) }))

		const { encodeJPEG } = require('../jpeg') as typeof import('../jpeg')

		const encoded = await encodeJPEG(img, iconSize, iconSize, undefined)
		expect(encoded).toBeTruthy()
		expect(encoded).toHaveLength(100)
	})

	test('ensure falls back to jpeg-js when jpeg-turbo is not available', async () => {
		const img = readFixtureJSON('fillImage-sample-icon-96.json')

		// Mock jpeg-turbo so that we can make it appear not installed
		jest.doMock('@julusian/jpeg-turbo', undefined)

		// Mock jpeg-js so we can see that it got used instead of jpeg-turbo
		jest.doMock('jpeg-js')
		const jpegJS: typeof import('jpeg-js') = require('jpeg-js')
		mocked(jpegJS.encode).mockImplementation((src) => ({ ...src, data: Uint8Array.alloc(100) }))

		const { encodeJPEG } = require('../jpeg') as typeof import('../jpeg')

		const encoded = await encodeJPEG(img, iconSize, iconSize, undefined)
		expect(encoded).toBeTruthy()
		expect(encoded).toHaveLength(100)
	})
})
