import { StreamdeckDefaultLcdService } from './generic.js'
import type { HIDDevice } from '../../hid-device.js'
import type { EncodeJPEGHelper } from '../../models/base.js'
import type { StreamDeckLcdSegmentControlDefinition } from '../../controlDefinition.js'

function makeMockDevice(): jest.Mocked<Pick<HIDDevice, 'sendReports'>> {
	return { sendReports: jest.fn().mockResolvedValue(undefined) } as any
}

function makeEncodeJpeg(): jest.MockedFunction<EncodeJPEGHelper> {
	return jest.fn(async (buf) => buf) // passthrough
}

const plusLcdControl: StreamDeckLcdSegmentControlDefinition = {
	type: 'lcd-segment',
	id: 0,
	row: 2,
	column: 0,
	columnSpan: 4,
	rowSpan: 1,
	pixelSize: { width: 800, height: 100 },
	drawRegions: true,
}

describe('StreamdeckDefaultLcdService', () => {
	let device: ReturnType<typeof makeMockDevice>
	let encodeJpeg: jest.MockedFunction<EncodeJPEGHelper>
	let service: StreamdeckDefaultLcdService

	beforeEach(() => {
		device = makeMockDevice()
		encodeJpeg = makeEncodeJpeg()
		service = new StreamdeckDefaultLcdService(encodeJpeg, device as any, [plusLcdControl], false)
	})

	describe('fillLcd', () => {
		test('calls sendReports for valid full-size rgb buffer', async () => {
			const buffer = new Uint8Array(800 * 100 * 3)
			await service.fillLcd(0, buffer, { format: 'rgb' })
			expect(device.sendReports).toHaveBeenCalledTimes(1)
		})

		test('throws for invalid index', async () => {
			const buffer = new Uint8Array(800 * 100 * 3)
			await expect(service.fillLcd(99, buffer, { format: 'rgb' })).rejects.toThrow('Invalid lcd segment index')
		})

		test('throws when buffer size does not match pixel dimensions', async () => {
			const wrongBuffer = new Uint8Array(100)
			await expect(service.fillLcd(0, wrongBuffer, { format: 'rgb' })).rejects.toThrow(RangeError)
		})

		test('calls encodeJPEG with the transformed buffer', async () => {
			const buffer = new Uint8Array(800 * 100 * 3)
			await service.fillLcd(0, buffer, { format: 'rgb' })
			expect(encodeJpeg).toHaveBeenCalledTimes(1)
		})

		test('rotate=true swaps width/height in encodeJPEG call', async () => {
			const rotatedService = new StreamdeckDefaultLcdService(encodeJpeg, device as any, [plusLcdControl], true)
			const buffer = new Uint8Array(800 * 100 * 3)
			await rotatedService.fillLcd(0, buffer, { format: 'rgb' })

			const [, w, h] = encodeJpeg.mock.calls[0]
			// With rotate=true, width and height are swapped
			expect(w).toBe(100)
			expect(h).toBe(800)
		})
	})

	describe('fillLcdRegion', () => {
		test('calls sendReports for a valid sub-region', async () => {
			const regionBuffer = new Uint8Array(100 * 50 * 3)
			await service.fillLcdRegion(0, 0, 0, regionBuffer, { format: 'rgb', width: 100, height: 50 })
			expect(device.sendReports).toHaveBeenCalledTimes(1)
		})

		test('throws for invalid index', async () => {
			const buffer = new Uint8Array(100 * 50 * 3)
			await expect(
				service.fillLcdRegion(99, 0, 0, buffer, { format: 'rgb', width: 100, height: 50 }),
			).rejects.toThrow('Invalid lcd segment index')
		})

		test('throws when region exceeds lcd width', async () => {
			// x=700 + width=200 > 800
			const buffer = new Uint8Array(200 * 50 * 3)
			await expect(
				service.fillLcdRegion(0, 700, 0, buffer, { format: 'rgb', width: 200, height: 50 }),
			).rejects.toThrow(TypeError)
		})

		test('throws when region exceeds lcd height', async () => {
			// y=80 + height=50 > 100
			const buffer = new Uint8Array(100 * 50 * 3)
			await expect(
				service.fillLcdRegion(0, 0, 80, buffer, { format: 'rgb', width: 100, height: 50 }),
			).rejects.toThrow(TypeError)
		})

		test('throws when buffer size does not match width*height*format.length', async () => {
			const wrongBuffer = new Uint8Array(10)
			await expect(
				service.fillLcdRegion(0, 0, 0, wrongBuffer, { format: 'rgb', width: 100, height: 50 }),
			).rejects.toThrow(RangeError)
		})

		test('throws for negative x position', async () => {
			const buffer = new Uint8Array(100 * 50 * 3)
			await expect(
				service.fillLcdRegion(0, -1, 0, buffer, { format: 'rgb', width: 100, height: 50 }),
			).rejects.toThrow(TypeError)
		})
	})

	describe('clearLcdSegment', () => {
		test('calls sendReports with black buffer for valid index', async () => {
			await service.clearLcdSegment(0)
			expect(device.sendReports).toHaveBeenCalledTimes(1)
		})

		test('throws for invalid index', async () => {
			await expect(service.clearLcdSegment(99)).rejects.toThrow('Invalid lcd segment index')
		})

		test('encodes a fully-zeroed rgba buffer to JPEG', async () => {
			await service.clearLcdSegment(0)
			const passedBuffer = encodeJpeg.mock.calls[0][0]
			// clearLcdSegment passes a zero-filled rgba buffer (800*100*4)
			expect(passedBuffer.length).toBe(800 * 100 * 4)
			expect(passedBuffer.every((b) => b === 0 || b === 255)).toBe(true) // rgba: alpha=255, rest=0
		})
	})

	describe('clearAllLcdSegments', () => {
		test('clears all registered lcd controls', async () => {
			const multiControl: StreamDeckLcdSegmentControlDefinition[] = [
				{ ...plusLcdControl, id: 0 },
				// Note: id is always 0 per the type definition currently, but test the loop behaviour
			]
			const svc = new StreamdeckDefaultLcdService(encodeJpeg, device as any, multiControl, false)
			await svc.clearAllLcdSegments()
			expect(device.sendReports).toHaveBeenCalledTimes(1)
		})

		test('does nothing for empty control list', async () => {
			const svc = new StreamdeckDefaultLcdService(encodeJpeg, device as any, [], false)
			await svc.clearAllLcdSegments()
			expect(device.sendReports).not.toHaveBeenCalled()
		})
	})

	describe('prepareFillLcdRegion', () => {
		test('returns a PreparedBuffer object (not undefined)', async () => {
			const buffer = new Uint8Array(100 * 50 * 3)
			const result = await service.prepareFillLcdRegion(0, 0, 0, buffer, {
				format: 'rgb',
				width: 100,
				height: 50,
			})
			expect(result).toBeDefined()
			expect(typeof result).toBe('object')
		})

		test('throws for invalid index', async () => {
			const buffer = new Uint8Array(100 * 50 * 3)
			await expect(
				service.prepareFillLcdRegion(99, 0, 0, buffer, { format: 'rgb', width: 100, height: 50 }),
			).rejects.toThrow()
		})
	})
})
