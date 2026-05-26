import { PedalPropertiesService } from './pedal.js'
import type { HIDDevice } from '../../hid-device.js'

function makeMockDevice(): jest.Mocked<Pick<HIDDevice, 'sendFeatureReport' | 'getFeatureReport'>> {
	return {
		sendFeatureReport: jest.fn().mockResolvedValue(undefined),
		getFeatureReport: jest.fn().mockResolvedValue(new Uint8Array(32)),
	} as any
}

describe('PedalPropertiesService', () => {
	let device: ReturnType<typeof makeMockDevice>
	let service: PedalPropertiesService

	beforeEach(() => {
		device = makeMockDevice()
		service = new PedalPropertiesService(device as any)
	})

	describe('setBrightness', () => {
		test('is a no-op — never calls sendFeatureReport', async () => {
			await service.setBrightness(100)
			await service.setBrightness(0)
			expect(device.sendFeatureReport).not.toHaveBeenCalled()
		})
	})

	describe('resetToLogo', () => {
		test('is a no-op — never calls sendFeatureReport', async () => {
			await service.resetToLogo()
			expect(device.sendFeatureReport).not.toHaveBeenCalled()
		})
	})

	describe('getFirmwareVersion', () => {
		test('reads report 5 length 32, parses null-terminated from offset 6', async () => {
			const report = new Uint8Array(32)
			const version = '1.0.1234'
			for (let i = 0; i < version.length; i++) report[6 + i] = version.charCodeAt(i)
			report[6 + version.length] = 0 // null terminator
			device.getFeatureReport.mockResolvedValueOnce(report)

			expect(await service.getFirmwareVersion()).toBe(version)
			expect(device.getFeatureReport).toHaveBeenCalledWith(5, 32)
		})

		test('handles missing null terminator (reads to end)', async () => {
			const report = new Uint8Array(32)
			report[6] = 65 // 'A'
			// No null terminator — indexOf(0, 6) returns -1
			device.getFeatureReport.mockResolvedValueOnce(report)

			const result = await service.getFirmwareVersion()
			expect(result.startsWith('A')).toBe(true)
		})
	})

	describe('getSerialNumber', () => {
		test('reads report 6 length 32, returns bytes 2-13 (12 bytes)', async () => {
			const report = new Uint8Array(32)
			const serial = 'PEDAL12345AB'
			for (let i = 0; i < serial.length; i++) report[2 + i] = serial.charCodeAt(i)
			device.getFeatureReport.mockResolvedValueOnce(report)

			expect(await service.getSerialNumber()).toBe(serial)
			expect(device.getFeatureReport).toHaveBeenCalledWith(6, 32)
		})
	})

	describe('getAllFirmwareVersions', () => {
		test('returns AP2 key with the firmware version', async () => {
			const report = new Uint8Array(32)
			const version = 'V1.0.001'
			for (let i = 0; i < version.length; i++) report[6 + i] = version.charCodeAt(i)
			report[6 + version.length] = 0
			device.getFeatureReport.mockResolvedValue(report)

			const result = await service.getAllFirmwareVersions()
			expect(result).toEqual({ AP2: version })
		})
	})
})
