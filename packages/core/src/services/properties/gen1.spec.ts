import { Gen1PropertiesService } from './gen1.js'
import type { HIDDevice } from '../../hid-device.js'

function makeMockDevice(): jest.Mocked<Pick<HIDDevice, 'sendFeatureReport' | 'getFeatureReport'>> {
	return {
		sendFeatureReport: jest.fn().mockResolvedValue(undefined),
		getFeatureReport: jest.fn().mockResolvedValue(new Uint8Array(32)),
	} as any
}

describe('Gen1PropertiesService', () => {
	let device: ReturnType<typeof makeMockDevice>
	let service: Gen1PropertiesService

	beforeEach(() => {
		device = makeMockDevice()
		service = new Gen1PropertiesService(device as any)
	})

	describe('setBrightness', () => {
		test('sends correct 17-byte buffer at 100%', async () => {
			await service.setBrightness(100)
			// prettier-ignore
			expect(device.sendFeatureReport).toHaveBeenCalledWith(new Uint8Array([0x05, 0x55, 0xaa, 0xd1, 0x01, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))
		})

		test('sends correct buffer at 0%', async () => {
			await service.setBrightness(0)
			// prettier-ignore
			expect(device.sendFeatureReport).toHaveBeenCalledWith(new Uint8Array([0x05, 0x55, 0xaa, 0xd1, 0x01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))
		})

		test('sends correct buffer at 50%', async () => {
			await service.setBrightness(50)
			// prettier-ignore
			expect(device.sendFeatureReport).toHaveBeenCalledWith(new Uint8Array([0x05, 0x55, 0xaa, 0xd1, 0x01, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))
		})

		test('throws RangeError on value > 100', async () => {
			await expect(service.setBrightness(101)).rejects.toThrow(RangeError)
			expect(device.sendFeatureReport).not.toHaveBeenCalled()
		})

		test('throws RangeError on negative value', async () => {
			await expect(service.setBrightness(-1)).rejects.toThrow(RangeError)
			expect(device.sendFeatureReport).not.toHaveBeenCalled()
		})
	})

	describe('resetToLogo', () => {
		test('sends correct 17-byte buffer', async () => {
			await service.resetToLogo()
			// prettier-ignore
			expect(device.sendFeatureReport).toHaveBeenCalledWith(new Uint8Array([0x0b, 0x63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))
		})
	})

	describe('getFirmwareVersion', () => {
		test('reads report 4 with length 32, parses null-terminated ASCII from offset 5', async () => {
			// Matches real device data: "1.0.170133"
			const report = new Uint8Array([4, 85, 170, 212, 4, 49, 46, 48, 46, 49, 55, 48, 49, 51, 51, 0, 0])
			device.getFeatureReport.mockResolvedValueOnce(report)

			expect(await service.getFirmwareVersion()).toBe('1.0.170133')
			expect(device.getFeatureReport).toHaveBeenCalledWith(4, 32)
		})

		test('returns string up to null terminator', async () => {
			const report = new Uint8Array(32)
			const version = 'V1.23456'
			for (let i = 0; i < version.length; i++) report[5 + i] = version.charCodeAt(i)
			report[5 + version.length] = 0
			device.getFeatureReport.mockResolvedValueOnce(report)

			expect(await service.getFirmwareVersion()).toBe(version)
		})

		test('falls back to length-17 report if length-32 throws', async () => {
			device.getFeatureReport.mockRejectedValueOnce(new Error('not supported'))
			const report = new Uint8Array([0, 0, 0, 0, 0, 49, 46, 48, 0, 0, 0, 0, 0, 0, 0, 0, 0])
			device.getFeatureReport.mockResolvedValueOnce(report)

			expect(await service.getFirmwareVersion()).toBe('1.0')
			expect(device.getFeatureReport).toHaveBeenNthCalledWith(1, 4, 32)
			expect(device.getFeatureReport).toHaveBeenNthCalledWith(2, 4, 17)
		})
	})

	describe('getSerialNumber', () => {
		test('reads 12-char serial from 32-byte report (older hardware, null-terminated)', async () => {
			// Matches real device data: "AL37G1A02840"
			const report = new Uint8Array(32)
			const serial = 'AL37G1A02840'
			for (let i = 0; i < serial.length; i++) report[5 + i] = serial.charCodeAt(i)
			// report[5 + 12] = 0x00 (already zero — null terminator)
			device.getFeatureReport.mockResolvedValueOnce(report)

			expect(await service.getSerialNumber()).toBe(serial)
			expect(device.getFeatureReport).toHaveBeenCalledWith(3, 32)
		})

		test('reads 14-char serial from 32-byte report (newer hardware revision)', async () => {
			const report = new Uint8Array(32)
			const serial = 'AL37G1A0284014'
			for (let i = 0; i < serial.length; i++) report[5 + i] = serial.charCodeAt(i)
			// report[5 + 14] = 0x00 (already zero — null terminator)
			device.getFeatureReport.mockResolvedValueOnce(report)

			expect(await service.getSerialNumber()).toBe(serial)
		})

		test('stops at junk bytes when device does not zero-pad the 32-byte report', async () => {
			// Regression: older firmware left non-zero garbage in the padding bytes
			const report = new Uint8Array(32).fill(0xff)
			const serial = 'AL37G1A02840'
			for (let i = 0; i < serial.length; i++) report[5 + i] = serial.charCodeAt(i)
			// no null terminator — bytes after serial are 0xff junk
			device.getFeatureReport.mockResolvedValueOnce(report)

			expect(await service.getSerialNumber()).toBe(serial)
		})

		test('falls back to length-17 report if length-32 throws', async () => {
			device.getFeatureReport.mockRejectedValueOnce(new Error('not supported'))
			const report = new Uint8Array(17)
			const serial = 'AL37G1A02840'
			for (let i = 0; i < serial.length; i++) report[5 + i] = serial.charCodeAt(i)
			device.getFeatureReport.mockResolvedValueOnce(report)

			expect(await service.getSerialNumber()).toBe(serial)
			expect(device.getFeatureReport).toHaveBeenNthCalledWith(1, 3, 32)
			expect(device.getFeatureReport).toHaveBeenNthCalledWith(2, 3, 17)
		})
	})

	describe('getAllFirmwareVersions', () => {
		test('returns empty object', async () => {
			expect(await service.getAllFirmwareVersions()).toEqual({})
			expect(device.getFeatureReport).not.toHaveBeenCalled()
		})
	})
})
