// tslint:disable-next-line: no-submodule-imports
import { mocked } from 'jest-mock'

import { DummyHID } from '../__mocks__/hid'

jest.mock('node-hid')
import { devicesAsync, openAsyncHIDDevice } from 'node-hid'
// Forcing path to be string, as there are multiple constructor options, we require the string one
mocked(openAsyncHIDDevice).mockImplementation(async (path: string | number) => new DummyHID(path as string))

// Must be required after we register a mock for `node-hid`.
import { getStreamDeckInfo, listStreamDecks, openStreamDeck } from '../'

describe('StreamDeck Devices', () => {
	test('no devices', async () => {
		mocked(devicesAsync).mockImplementation(async () => [])

		await expect(listStreamDecks()).resolves.toEqual([])
	})
	test('some devices', async () => {
		mocked(devicesAsync).mockImplementation(async () => [
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

		await expect(listStreamDecks()).resolves.toEqual([
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
	test('info for bad path', async () => {
		mocked(devicesAsync).mockImplementation(async () => [
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

		const info = await getStreamDeckInfo('not-a-real-path')
		expect(info).toBeFalsy()

		const info2 = await getStreamDeckInfo('path-bad-product')
		expect(info2).toBeFalsy()
	})
	test('info for good path', async () => {
		mocked(devicesAsync).mockImplementation(async () => [
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

		const info2 = await getStreamDeckInfo('path-original2')
		expect(info2).toEqual({
			model: 'original',
			path: 'path-original2',
			serialNumber: 'some-number-again',
		})
	})
	test('create for bad path', async () => {
		mocked(devicesAsync).mockImplementation(async () => [
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

		await expect(openStreamDeck('not-a-real-path')).rejects.toThrow(
			new Error(`Device "not-a-real-path" was not found`)
		)

		await expect(openStreamDeck('path-bad-product')).rejects.toThrow(
			new Error(`Device "path-bad-product" was not found`)
		)
	})
})
