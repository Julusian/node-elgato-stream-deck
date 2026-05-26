import { StudioEncoderLedService } from './studio.js'
import type { HIDDevice } from '../../hid-device.js'
import type { StreamDeckControlDefinition } from '../../controlDefinition.js'

function makeMockDevice(): jest.Mocked<Pick<HIDDevice, 'sendReports'>> {
	return {
		sendReports: jest.fn().mockResolvedValue(undefined),
	} as any
}

const twoEncoderControls: StreamDeckControlDefinition[] = [
	{ type: 'encoder', index: 0, hidIndex: 0, row: 0, column: 0, hasLed: true, ledRingSteps: 24 },
	{ type: 'encoder', index: 1, hidIndex: 1, row: 0, column: 1, hasLed: true, ledRingSteps: 24, lcdRingOffset: 12 },
]

describe('StudioEncoderLedService', () => {
	let device: ReturnType<typeof makeMockDevice>
	let service: StudioEncoderLedService

	beforeEach(() => {
		device = makeMockDevice()
		service = new StudioEncoderLedService(device as any, twoEncoderControls)
	})

	describe('setEncoderColor', () => {
		test('sends 1024-byte buffer via sendReports with correct header bytes', async () => {
			await service.setEncoderColor(0, 255, 128, 64)

			expect(device.sendReports).toHaveBeenCalledTimes(1)
			const packets = (device.sendReports as jest.Mock).mock.calls[0][0] as Uint8Array[]
			expect(packets).toHaveLength(1)
			const buf = packets[0]

			expect(buf.length).toBe(1024)
			expect(buf[0]).toBe(0x02)
			expect(buf[1]).toBe(0x10)
			expect(buf[2]).toBe(0) // encoder index
			expect(buf[3]).toBe(255) // r
			expect(buf[4]).toBe(128) // g
			expect(buf[5]).toBe(64) // b
		})

		test('includes correct encoder index in buffer', async () => {
			await service.setEncoderColor(1, 0, 255, 0)

			const packets = (device.sendReports as jest.Mock).mock.calls[0][0] as Uint8Array[]
			expect(packets[0][2]).toBe(1)
		})

		test('throws for encoder with hasLed=false', async () => {
			const noLedControls: StreamDeckControlDefinition[] = [
				{ type: 'encoder', index: 0, hidIndex: 0, row: 0, column: 0, hasLed: false, ledRingSteps: 0 },
			]
			const svc = new StudioEncoderLedService(device as any, noLedControls)
			await expect(svc.setEncoderColor(0, 255, 0, 0)).rejects.toThrow('Encoder does not have an LED')
		})

		test('throws for invalid encoder index', async () => {
			await expect(service.setEncoderColor(99, 0, 0, 0)).rejects.toThrow()
		})
	})

	describe('setEncoderRingSingleColor', () => {
		test('sends 1024-byte buffer with correct header and repeated color per step', async () => {
			await service.setEncoderRingSingleColor(0, 200, 100, 50)

			expect(device.sendReports).toHaveBeenCalledTimes(1)
			const buf = (device.sendReports as jest.Mock).mock.calls[0][0][0] as Uint8Array

			expect(buf.length).toBe(1024)
			expect(buf[0]).toBe(0x02)
			expect(buf[1]).toBe(0x0f)
			expect(buf[2]).toBe(0) // encoder index

			// Check all 24 steps packed from offset 3
			for (let i = 0; i < 24; i++) {
				expect(buf[3 + i * 3]).toBe(200) // r
				expect(buf[3 + i * 3 + 1]).toBe(100) // g
				expect(buf[3 + i * 3 + 2]).toBe(50) // b
			}
		})

		test('throws for encoder with no ring (ledRingSteps = 0)', async () => {
			const noRingControls: StreamDeckControlDefinition[] = [
				{ type: 'encoder', index: 0, hidIndex: 0, row: 0, column: 0, hasLed: true, ledRingSteps: 0 },
			]
			const svc = new StudioEncoderLedService(device as any, noRingControls)
			await expect(svc.setEncoderRingSingleColor(0, 0, 0, 0)).rejects.toThrow()
		})

		test('throws for invalid encoder index', async () => {
			await expect(service.setEncoderRingSingleColor(99, 0, 0, 0)).rejects.toThrow()
		})
	})

	describe('setEncoderRingColors', () => {
		test('sends correct per-pixel colors in 1024-byte buffer from offset 3', async () => {
			const colors = new Uint8Array(24 * 3)
			colors[0] = 111
			colors[1] = 222
			colors[2] = 33

			await service.setEncoderRingColors(0, colors)

			const buf = (device.sendReports as jest.Mock).mock.calls[0][0][0] as Uint8Array
			expect(buf[0]).toBe(0x02)
			expect(buf[1]).toBe(0x0f)
			expect(buf[2]).toBe(0) // encoder index
			expect(buf[3]).toBe(111)
			expect(buf[4]).toBe(222)
			expect(buf[5]).toBe(33)
		})

		test('throws when colors array has wrong length', async () => {
			await expect(service.setEncoderRingColors(0, new Uint8Array(5))).rejects.toThrow('Invalid colors length')
		})

		test('applies lcdRingOffset=12 rotation for encoder 1', async () => {
			const colors = new Uint8Array(24 * 3)
			// pixel 12 in input becomes pixel 0 in output buffer
			colors[12 * 3] = 77
			colors[12 * 3 + 1] = 88
			colors[12 * 3 + 2] = 99

			await service.setEncoderRingColors(1, colors)

			const buf = (device.sendReports as jest.Mock).mock.calls[0][0][0] as Uint8Array
			// After rotation: first 12 pixels = original[12..23], next 12 = original[0..11]
			expect(buf[3]).toBe(77)
			expect(buf[4]).toBe(88)
			expect(buf[5]).toBe(99)
		})

		test('throws for invalid encoder index', async () => {
			await expect(service.setEncoderRingColors(99, new Uint8Array(72))).rejects.toThrow()
		})
	})

	describe('clearAll', () => {
		test('calls setEncoderColor(0,0,0) for each encoder with hasLed=true', async () => {
			await service.clearAll()

			// Each encoder has hasLed=true and ledRingSteps=24
			// So clearAll calls setEncoderColor + setEncoderRingSingleColor for each = 4 sendReports calls total
			const calls = (device.sendReports as jest.Mock).mock.calls
			const colorCalls = calls.filter(([pkts]) => pkts[0][1] === 0x10)
			const ringCalls = calls.filter(([pkts]) => pkts[0][1] === 0x0f)

			expect(colorCalls).toHaveLength(2) // one per encoder
			expect(ringCalls).toHaveLength(2) // one per encoder

			// All calls are black
			for (const [pkts] of calls) {
				expect(pkts[0][3]).toBe(0)
				expect(pkts[0][4]).toBe(0)
				expect(pkts[0][5]).toBe(0)
			}
		})

		test('skips setEncoderColor for encoders with hasLed=false', async () => {
			const mixedControls: StreamDeckControlDefinition[] = [
				{ type: 'encoder', index: 0, hidIndex: 0, row: 0, column: 0, hasLed: false, ledRingSteps: 24 },
				{ type: 'encoder', index: 1, hidIndex: 1, row: 0, column: 1, hasLed: true, ledRingSteps: 0 },
			]
			const svc = new StudioEncoderLedService(device as any, mixedControls)
			await svc.clearAll()

			const calls = (device.sendReports as jest.Mock).mock.calls
			// encoder 0: no LED, has ring → only ring call; encoder 1: has LED, no ring → only color call
			const colorCalls = calls.filter(([pkts]) => pkts[0][1] === 0x10)
			const ringCalls = calls.filter(([pkts]) => pkts[0][1] === 0x0f)
			expect(colorCalls).toHaveLength(1)
			expect(ringCalls).toHaveLength(1)
		})
	})
})
