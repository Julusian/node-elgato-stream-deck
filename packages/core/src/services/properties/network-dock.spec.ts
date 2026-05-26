import { NetworkDockPropertiesService } from './network-dock.js'
import type { HIDDevice } from '../../hid-device.js'

function makeMockDevice(): jest.Mocked<Pick<HIDDevice, 'sendFeatureReport' | 'getFeatureReport'>> {
	return {
		sendFeatureReport: jest.fn().mockResolvedValue(undefined),
		getFeatureReport: jest.fn().mockResolvedValue(new Uint8Array(64)),
	} as any
}

describe('NetworkDockPropertiesService', () => {
	let device: ReturnType<typeof makeMockDevice>
	let service: NetworkDockPropertiesService

	beforeEach(() => {
		device = makeMockDevice()
		service = new NetworkDockPropertiesService(device as any)
	})

	describe('setBrightness', () => {
		test('is a no-op — never calls sendFeatureReport', async () => {
			await service.setBrightness(100)
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
		test('reads report 0x83, returns bytes 8-15 as ASCII', async () => {
			const report = new Uint8Array(64)
			const version = 'V1.0.001'
			for (let i = 0; i < 8; i++) report[8 + i] = version.charCodeAt(i)
			device.getFeatureReport.mockResolvedValueOnce(report)

			expect(await service.getFirmwareVersion()).toBe(version)
			expect(device.getFeatureReport).toHaveBeenCalledWith(0x83, -1)
		})
	})

	describe('getSerialNumber', () => {
		test('reads report 0x84, uses byte 3 as length, then reads from byte 4', async () => {
			const report = new Uint8Array(64)
			const serial = 'DOCK-ABC123'
			report[3] = serial.length
			for (let i = 0; i < serial.length; i++) report[4 + i] = serial.charCodeAt(i)
			device.getFeatureReport.mockResolvedValueOnce(report)

			expect(await service.getSerialNumber()).toBe(serial)
			expect(device.getFeatureReport).toHaveBeenCalledWith(0x84, -1)
		})
	})

	describe('getAllFirmwareVersions', () => {
		test('calls getFeatureReport(0x83, -1) once', async () => {
			await service.getAllFirmwareVersions()
			expect(device.getFeatureReport).toHaveBeenCalledWith(0x83, -1)
		})

		test('parses AP2 version from report 0x83 bytes 6-13 (via parseAllFirmwareVersionsHelper)', async () => {
			const report = new Uint8Array(64)
			// parseAllFirmwareVersionsHelper receives ap2 = report.slice(2), so ap2[6-13] = report[8-15]
			const versionStr = 'V1.0.003'
			for (let i = 0; i < 8; i++) report[8 + i] = versionStr.charCodeAt(i)
			device.getFeatureReport.mockResolvedValueOnce(report)

			const result = await service.getAllFirmwareVersions()
			expect(result.AP2).toBe(versionStr)
		})
	})
})
