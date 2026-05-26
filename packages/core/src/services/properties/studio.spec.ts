import { StudioPropertiesService } from './studio.js'
import type { HIDDevice } from '../../hid-device.js'

function makeMockDevice(): jest.Mocked<Pick<HIDDevice, 'sendFeatureReport' | 'getFeatureReport'>> {
	return {
		sendFeatureReport: jest.fn().mockResolvedValue(undefined),
		getFeatureReport: jest.fn().mockResolvedValue(new Uint8Array(32)),
	} as any
}

describe('StudioPropertiesService', () => {
	let device: ReturnType<typeof makeMockDevice>
	let service: StudioPropertiesService

	beforeEach(() => {
		device = makeMockDevice()
		service = new StudioPropertiesService(device as any)
	})

	describe('setBrightness / resetToLogo', () => {
		test('setBrightness delegates to gen2 (32-byte buffer with 0x03,0x08)', async () => {
			await service.setBrightness(75)
			const expected = new Uint8Array(32)
			expected[0] = 0x03
			expected[1] = 0x08
			expected[2] = 75
			expect(device.sendFeatureReport).toHaveBeenCalledWith(expected)
		})

		test('resetToLogo delegates to gen2 (32-byte buffer with 0x03,0x02)', async () => {
			await service.resetToLogo()
			const expected = new Uint8Array(32)
			expected[0] = 0x03
			expected[1] = 0x02
			expect(device.sendFeatureReport).toHaveBeenCalledWith(expected)
		})
	})

	describe('getAllFirmwareVersions', () => {
		test('calls getFeatureReport for three report IDs: 0x05, 0x11, 0x13', async () => {
			await service.getAllFirmwareVersions()

			expect(device.getFeatureReport).toHaveBeenCalledTimes(3)
			expect(device.getFeatureReport).toHaveBeenCalledWith(0x05, 32)
			expect(device.getFeatureReport).toHaveBeenCalledWith(0x11, 32)
			expect(device.getFeatureReport).toHaveBeenCalledWith(0x13, 32)
		})

		test('all three reports are fetched concurrently (Promise.all)', async () => {
			const order: number[] = []
			device.getFeatureReport.mockImplementation(async (reportId) => {
				order.push(reportId)
				return new Uint8Array(32)
			})

			await service.getAllFirmwareVersions()

			// All three should be requested (order may vary, but all three must appear)
			expect(order).toHaveLength(3)
			expect(order).toContain(0x05)
			expect(order).toContain(0x11)
			expect(order).toContain(0x13)
		})

		test('parses ap2 data from report 0x05 (bytes 6-13)', async () => {
			const ap2Report = new Uint8Array(32)
			const ap2Version = 'STUDIO01'
			for (let i = 0; i < 8; i++) ap2Report[6 + i] = ap2Version.charCodeAt(i)

			// Return ap2 report for 0x05, empty for the others
			device.getFeatureReport.mockImplementation(async (reportId) => {
				if (reportId === 0x05) return ap2Report
				return new Uint8Array(32) // no 0x18 marker, so encoder reports are ignored
			})

			const result = await service.getAllFirmwareVersions()
			expect(result.AP2).toBe('STUDIO01')
		})

		test('parses encoder data when encoder reports have 0x18 marker', async () => {
			const ap2Report = new Uint8Array(32)
			const encoderAp2Report = new Uint8Array(32)
			const encoderLdReport = new Uint8Array(32)

			encoderAp2Report[0] = 0x18
			const ap2eVersion = 'EAP20001'
			for (let i = 0; i < 8; i++) encoderAp2Report[2 + i] = ap2eVersion.charCodeAt(i)

			encoderLdReport[1] = 0x18
			const ldVersion = 'ELD00001'
			for (let i = 0; i < 8; i++) encoderLdReport[2 + i] = ldVersion.charCodeAt(i)

			device.getFeatureReport.mockImplementation(async (reportId) => {
				if (reportId === 0x05) return ap2Report
				if (reportId === 0x11) return encoderAp2Report
				if (reportId === 0x13) return encoderLdReport
				return new Uint8Array(32)
			})

			const result = await service.getAllFirmwareVersions()
			expect(result.ENCODER_AP2).toBe('EAP20001')
			expect(result.ENCODER_LD).toBe('ELD00001')
		})
	})
})
