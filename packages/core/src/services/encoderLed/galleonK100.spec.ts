import { GalleonK100EncoderLedService } from './galleonK100.js'
import type { HIDDevice } from '../../hid-device.js'
import type { StreamDeckControlDefinition } from '../../controlDefinition.js'

function makeMockDevice(): jest.Mocked<Pick<HIDDevice, 'sendFeatureReport' | 'sendReports'>> {
	return {
		sendFeatureReport: jest.fn().mockResolvedValue(undefined),
		sendReports: jest.fn().mockResolvedValue(undefined),
	} as any
}

// Two encoders: index 0 (12 ring steps), index 1 (12 ring steps, lcdRingOffset=6)
const twoEncoderControls: StreamDeckControlDefinition[] = [
	{ type: 'encoder', index: 0, hidIndex: 0, row: 0, column: 0, hasLed: false, ledRingSteps: 12 },
	{ type: 'encoder', index: 1, hidIndex: 1, row: 0, column: 1, hasLed: false, ledRingSteps: 12, lcdRingOffset: 6 },
]

describe('GalleonK100EncoderLedService', () => {
	let device: ReturnType<typeof makeMockDevice>
	let service: GalleonK100EncoderLedService

	beforeEach(() => {
		device = makeMockDevice()
		service = new GalleonK100EncoderLedService(device as any, twoEncoderControls)
	})

	describe('setEncoderColor', () => {
		test('always throws — GalleonK100 has no central encoder LED', async () => {
			await expect(service.setEncoderColor(0, 255, 0, 0)).rejects.toThrow('Encoder does not have an LED')
		})

		test('throws for invalid encoder index', async () => {
			await expect(service.setEncoderColor(99, 255, 0, 0)).rejects.toThrow()
		})
	})

	describe('setEncoderRingSingleColor', () => {
		test('sends one sendFeatureReport per ring step with correct buffer format', async () => {
			await service.setEncoderRingSingleColor(0, 255, 128, 64)

			// encoder 0: offset = (1 - 0) * 12 = 12, steps 0..11 → pixels 12..23
			expect(device.sendFeatureReport).toHaveBeenCalledTimes(12)

			// Check the first call: pixel index 12 (offset + 0)
			const firstCall = (device.sendFeatureReport as jest.Mock).mock.calls[0][0] as Uint8Array
			expect(firstCall).toEqual(new Uint8Array([0x03, 0x24, 12, 255, 128, 64]))
		})

		test('sends correct pixel indices for encoder 1 with no offset', async () => {
			// encoder 1: offset = (1 - 1) * 12 = 0, steps 0..11 → pixels 0..11
			await service.setEncoderRingSingleColor(1, 10, 20, 30)

			expect(device.sendFeatureReport).toHaveBeenCalledTimes(12)
			const firstCall = (device.sendFeatureReport as jest.Mock).mock.calls[0][0] as Uint8Array
			expect(firstCall[2]).toBe(0) // pixel index = 0
			expect(firstCall[3]).toBe(10)
			expect(firstCall[4]).toBe(20)
			expect(firstCall[5]).toBe(30)
		})

		test('sends black (0,0,0) for clearAll', async () => {
			await service.setEncoderRingSingleColor(0, 0, 0, 0)

			const firstCall = (device.sendFeatureReport as jest.Mock).mock.calls[0][0] as Uint8Array
			expect(firstCall[3]).toBe(0)
			expect(firstCall[4]).toBe(0)
			expect(firstCall[5]).toBe(0)
		})

		test('throws for invalid encoder index', async () => {
			await expect(service.setEncoderRingSingleColor(99, 0, 0, 0)).rejects.toThrow()
		})

		test('throws for encoder with no ring (ledRingSteps <= 0)', async () => {
			const noRingControls: StreamDeckControlDefinition[] = [
				{ type: 'encoder', index: 0, hidIndex: 0, row: 0, column: 0, hasLed: false, ledRingSteps: 0 },
			]
			const svc = new GalleonK100EncoderLedService(device as any, noRingControls)
			await expect(svc.setEncoderRingSingleColor(0, 0, 0, 0)).rejects.toThrow()
		})
	})

	describe('setEncoderRingColors', () => {
		test('sends correct per-pixel colors for encoder 0', async () => {
			const colors = new Uint8Array(12 * 3)
			// Set pixel 0 = red, pixel 1 = green
			colors[0] = 255
			colors[1] = 0
			colors[2] = 0
			colors[3] = 0
			colors[4] = 255
			colors[5] = 0

			await service.setEncoderRingColors(0, colors)

			expect(device.sendFeatureReport).toHaveBeenCalledTimes(12)

			// Pixel 0 at send index 0 → feature report for absolute index offset+0
			const call0 = (device.sendFeatureReport as jest.Mock).mock.calls[0][0] as Uint8Array
			expect(call0[3]).toBe(255) // r
			expect(call0[4]).toBe(0) // g
			expect(call0[5]).toBe(0) // b

			const call1 = (device.sendFeatureReport as jest.Mock).mock.calls[1][0] as Uint8Array
			expect(call1[3]).toBe(0)
			expect(call1[4]).toBe(255)
		})

		test('throws when colors array has wrong length', async () => {
			await expect(service.setEncoderRingColors(0, new Uint8Array(5))).rejects.toThrow('Invalid colors length')
		})

		test('applies lcdRingOffset rotation for encoder 1 (offset=6)', async () => {
			// With lcdRingOffset=6, colors are rotated: send colors[6*3..] then colors[..6*3]
			const colors = new Uint8Array(12 * 3)
			// pixel 6 in input → becomes pixel 0 in output
			colors[6 * 3] = 99
			colors[6 * 3 + 1] = 88
			colors[6 * 3 + 2] = 77

			await service.setEncoderRingColors(1, colors)

			// First sendFeatureReport should contain pixel at original index 6 (after rotation)
			const firstCall = (device.sendFeatureReport as jest.Mock).mock.calls[0][0] as Uint8Array
			expect(firstCall[3]).toBe(99)
			expect(firstCall[4]).toBe(88)
			expect(firstCall[5]).toBe(77)
		})

		test('throws for invalid encoder index', async () => {
			await expect(service.setEncoderRingColors(99, new Uint8Array(36))).rejects.toThrow()
		})
	})

	describe('clearAll', () => {
		test('calls setEncoderRingSingleColor(0,0,0) for each encoder with ledRingSteps > 0', async () => {
			await service.clearAll()

			// Both encoders have 12 ring steps, so 12 calls each = 24 total
			expect(device.sendFeatureReport).toHaveBeenCalledTimes(24)
			const calls = (device.sendFeatureReport as jest.Mock).mock.calls
			for (const [buf] of calls) {
				expect((buf as Uint8Array)[3]).toBe(0)
				expect((buf as Uint8Array)[4]).toBe(0)
				expect((buf as Uint8Array)[5]).toBe(0)
			}
		})

		test('skips encoders with no ring (ledRingSteps = 0)', async () => {
			const noRingControls: StreamDeckControlDefinition[] = [
				{ type: 'encoder', index: 0, hidIndex: 0, row: 0, column: 0, hasLed: false, ledRingSteps: 0 },
				{ type: 'encoder', index: 1, hidIndex: 1, row: 0, column: 1, hasLed: false, ledRingSteps: 8 },
			]
			const svc = new GalleonK100EncoderLedService(device as any, noRingControls)
			await svc.clearAll()

			// Only encoder 1 has a ring — 8 calls
			expect(device.sendFeatureReport).toHaveBeenCalledTimes(8)
		})
	})
})
