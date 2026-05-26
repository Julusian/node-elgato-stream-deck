import { Gen2PropertiesService } from './gen2.js'
import type { HIDDevice } from '../../hid-device.js'

function makeMockDevice(): jest.Mocked<Pick<HIDDevice, 'sendFeatureReport' | 'getFeatureReport'>> {
	return {
		sendFeatureReport: jest.fn().mockResolvedValue(undefined),
		getFeatureReport: jest.fn().mockResolvedValue(new Uint8Array(32)),
	} as any
}

describe('Gen2PropertiesService', () => {
	let device: ReturnType<typeof makeMockDevice>
	let service: Gen2PropertiesService

	beforeEach(() => {
		device = makeMockDevice()
		service = new Gen2PropertiesService(device as any)
	})

	describe('setBrightness', () => {
		test('sends correct 32-byte buffer at 100%', async () => {
			await service.setBrightness(100)
			const expected = new Uint8Array(32)
			expected[0] = 0x03
			expected[1] = 0x08
			expected[2] = 100
			expect(device.sendFeatureReport).toHaveBeenCalledWith(expected)
		})

		test('sends correct buffer at 0%', async () => {
			await service.setBrightness(0)
			const expected = new Uint8Array(32)
			expected[0] = 0x03
			expected[1] = 0x08
			expected[2] = 0
			expect(device.sendFeatureReport).toHaveBeenCalledWith(expected)
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
		test('sends correct 32-byte buffer', async () => {
			await service.resetToLogo()
			const expected = new Uint8Array(32)
			expected[0] = 0x03
			expected[1] = 0x02
			expect(device.sendFeatureReport).toHaveBeenCalledWith(expected)
		})
	})

	describe('getFirmwareVersion', () => {
		test('reads report 5 with length 32, parses using length prefix', async () => {
			// Matches real device data: "1.00.004" - val[1]=12, end=14, subarray(6,14)
			// prettier-ignore
			const report = new Uint8Array([5, 12, 254, 90, 239, 250, 49, 46, 48, 48, 46, 48, 48, 52, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
			device.getFeatureReport.mockResolvedValueOnce(report)

			expect(await service.getFirmwareVersion()).toBe('1.00.004')
			expect(device.getFeatureReport).toHaveBeenCalledWith(5, 32)
		})

		test('length prefix controls how many bytes are read', async () => {
			const report = new Uint8Array(32)
			report[1] = 5 // length = 5, so end = 7, subarray(6, 7) = 1 byte
			report[6] = 65 // 'A'
			device.getFeatureReport.mockResolvedValueOnce(report)

			expect(await service.getFirmwareVersion()).toBe('A')
		})
	})

	describe('getSerialNumber', () => {
		test('reads report 6 with length 32, parses using length prefix from offset 2', async () => {
			// Matches real device data: "CL18I1A00913" - val[1]=12, end=14, subarray(2,14)
			// prettier-ignore
			const report = new Uint8Array([6, 12, 67, 76, 49, 56, 73, 49, 65, 48, 48, 57, 49, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
			device.getFeatureReport.mockResolvedValueOnce(report)

			expect(await service.getSerialNumber()).toBe('CL18I1A00913')
			expect(device.getFeatureReport).toHaveBeenCalledWith(6, 32)
		})
	})

	describe('getAllFirmwareVersions', () => {
		test('returns AP2 key with firmware version', async () => {
			// prettier-ignore
			const report = new Uint8Array([5, 12, 254, 90, 239, 250, 49, 46, 48, 48, 46, 48, 48, 52, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
			device.getFeatureReport.mockResolvedValueOnce(report)

			const result = await service.getAllFirmwareVersions()
			expect(result).toEqual({ AP2: '1.00.004' })
		})
	})
})
