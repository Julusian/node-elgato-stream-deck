// tslint:disable-next-line: no-submodule-imports
import { mocked } from 'ts-jest/utils'

import { DummyHID } from '../__mocks__/hid'

jest.mock('node-hid')
import { devices, HID } from 'node-hid'
// Forcing path to be string, as there are multiple constructor options, we require the string one
mocked(HID).mockImplementation((path: any) => new DummyHID(path))

// Must be required after we register a mock for `node-hid`.
import { getStreamDeckInfo, listStreamDecks, openStreamDeck } from '../'

describe('StreamDeck Devices', () => {
	test('no devices', () => {
		mocked(devices).mockImplementation(() => [])

		expect(listStreamDecks()).toEqual([])
	})
	test('some devices', () => {
		mocked(devices).mockImplementation(() => [
			{
				productId: 0x0060,
				vendorId: 0x0fd9,
				interface: 0,
				path: 'path-original',
				serialNumber: 'some-number',
				release: 0,
			},
			{
				productId: 0x0060,
				vendorId: 0x0fd9,
				interface: 0,
				path: 'path-original2',
				serialNumber: 'some-number-again',
				release: 0,
			},
			{
				productId: 0x0063,
				vendorId: 0x0fd9,
				interface: 0,
				path: 'path-mini',
				release: 0,
			},
			{
				productId: 0x0060,
				vendorId: 0x0f00,
				interface: 0,
				path: 'path-wrog-vendor',
				release: 0,
			},
			{
				productId: 0x0022,
				vendorId: 0x0fd9,
				interface: 0,
				path: 'path-bad-product',
				release: 0,
			},
		])

		expect(listStreamDecks()).toEqual([
			{
				model: 'original',
				path: 'path-original',
				serialNumber: 'some-number',
			},
			{
				model: 'original',
				path: 'path-original2',
				serialNumber: 'some-number-again',
			},
			{
				model: 'mini',
				path: 'path-mini',
				serialNumber: undefined,
			},
		])
	})
	test('info for bad path', () => {
		mocked(devices).mockImplementation(() => [
			{
				productId: 0x0060,
				vendorId: 0x0fd9,
				interface: 0,
				path: 'path-original',
				serialNumber: 'some-number',
				release: 0,
			},
			{
				productId: 0x0022,
				vendorId: 0x0fd9,
				interface: 0,
				path: 'path-bad-product',
				release: 0,
			},
		])

		const info = getStreamDeckInfo('not-a-real-path')
		expect(info).toBeFalsy()

		const info2 = getStreamDeckInfo('path-bad-product')
		expect(info2).toBeFalsy()
	})
	test('info for good path', () => {
		mocked(devices).mockImplementation(() => [
			{
				productId: 0x0060,
				vendorId: 0x0fd9,
				interface: 0,
				path: 'path-original',
				serialNumber: 'some-number',
				release: 0,
			},
			{
				productId: 0x0060,
				vendorId: 0x0fd9,
				interface: 0,
				path: 'path-original2',
				serialNumber: 'some-number-again',
				release: 0,
			},
		])

		const info2 = getStreamDeckInfo('path-original2')
		expect(info2).toEqual({
			model: 'original',
			path: 'path-original2',
			serialNumber: 'some-number-again',
		})
	})
	test('create for bad path', () => {
		mocked(devices).mockImplementation(() => [
			{
				productId: 0x0060,
				vendorId: 0x0fd9,
				interface: 0,
				path: 'path-original',
				serialNumber: 'some-number',
				release: 0,
			},
			{
				productId: 0x0022,
				vendorId: 0x0fd9,
				interface: 0,
				path: 'path-bad-product',
				release: 0,
			},
		])

		expect(() => openStreamDeck('not-a-real-path')).toThrowError(
			new Error(`Device "not-a-real-path" was not found`)
		)

		expect(() => openStreamDeck('path-bad-product')).toThrowError(
			new Error(`Device "path-bad-product" was not found`)
		)
	})
})
