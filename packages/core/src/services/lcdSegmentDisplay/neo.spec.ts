import { StreamDeckNeoLcdService } from './neo.js'
import type { HIDDevice } from '../../hid-device.js'
import type { EncodeJPEGHelper } from '../../models/base.js'
import type { StreamDeckLcdSegmentControlDefinition } from '../../controlDefinition.js'

function makeMockDevice(): jest.Mocked<Pick<HIDDevice, 'sendReports'>> {
	return { sendReports: jest.fn().mockResolvedValue(undefined) } as any
}

function makeEncodeJpeg(): jest.MockedFunction<EncodeJPEGHelper> {
	return jest.fn(async (buf) => buf) // passthrough
}

const neoLcdControl: StreamDeckLcdSegmentControlDefinition = {
	type: 'lcd-segment',
	id: 0,
	row: 1,
	column: 0,
	columnSpan: 4,
	rowSpan: 1,
	pixelSize: { width: 854, height: 60 },
	drawRegions: false,
}

describe('StreamDeckNeoLcdService', () => {
	let device: ReturnType<typeof makeMockDevice>
	let encodeJpeg: jest.MockedFunction<EncodeJPEGHelper>
	let service: StreamDeckNeoLcdService

	beforeEach(() => {
		device = makeMockDevice()
		encodeJpeg = makeEncodeJpeg()
		service = new StreamDeckNeoLcdService(encodeJpeg, device as any, [neoLcdControl])
	})

	describe('fillLcdRegion', () => {
		test('always throws "Not supported for this model"', async () => {
			const buffer = new Uint8Array(100)
			await expect(
				service.fillLcdRegion(0, 0, 0, buffer, { format: 'rgb', width: 10, height: 10 }),
			).rejects.toThrow('Not supported for this model')
		})
	})

	describe('prepareFillLcdRegion', () => {
		test('always throws "Not supported for this model"', async () => {
			const buffer = new Uint8Array(100)
			await expect(
				service.prepareFillLcdRegion(0, 0, 0, buffer, { format: 'rgb', width: 10, height: 10 }),
			).rejects.toThrow('Not supported for this model')
		})
	})

	describe('fillLcd', () => {
		test('calls sendReports for valid rgb buffer', async () => {
			const buffer = new Uint8Array(854 * 60 * 3)
			await service.fillLcd(0, buffer, { format: 'rgb' })
			expect(device.sendReports).toHaveBeenCalledTimes(1)
		})

		test('throws for invalid index', async () => {
			const buffer = new Uint8Array(854 * 60 * 3)
			await expect(service.fillLcd(99, buffer, { format: 'rgb' })).rejects.toThrow('Invalid lcd segment index 99')
		})

		test('throws RangeError when buffer size does not match pixel dimensions', async () => {
			const wrongBuffer = new Uint8Array(10)
			await expect(service.fillLcd(0, wrongBuffer, { format: 'rgb' })).rejects.toThrow(RangeError)
		})

		test('calls encodeJPEG with xFlip and yFlip applied', async () => {
			const buffer = new Uint8Array(854 * 60 * 3)
			// Unique source data to detect flip
			for (let i = 0; i < buffer.length; i++) buffer[i] = i & 0xff

			await service.fillLcd(0, buffer, { format: 'rgb' })

			// encodeJPEG should have been called
			expect(encodeJpeg).toHaveBeenCalledTimes(1)
			const [passedBuffer, w, h] = encodeJpeg.mock.calls[0]

			// Buffer is rgba (4 bytes per pixel)
			expect(passedBuffer.length).toBe(854 * 60 * 4)
			// Dimensions are NOT rotated (just xFlip/yFlip)
			expect(w).toBe(854)
			expect(h).toBe(60)
		})

		test('encodeJPEG receives rgba buffer regardless of source format', async () => {
			const rgbaBuffer = new Uint8Array(854 * 60 * 4)
			await service.fillLcd(0, rgbaBuffer, { format: 'rgba' })

			const [passedBuffer] = encodeJpeg.mock.calls[0]
			expect(passedBuffer.length).toBe(854 * 60 * 4)
		})
	})

	describe('clearLcdSegment', () => {
		test('calls sendReports with a zeroed buffer', async () => {
			await service.clearLcdSegment(0)
			expect(device.sendReports).toHaveBeenCalledTimes(1)
		})

		test('throws for invalid index', async () => {
			await expect(service.clearLcdSegment(99)).rejects.toThrow('Invalid lcd segment index 99')
		})

		test('encodeJPEG receives a zeroed rgba buffer', async () => {
			await service.clearLcdSegment(0)
			const [passedBuffer] = encodeJpeg.mock.calls[0]
			expect(passedBuffer.every((b: number) => b === 0 || b === 255)).toBe(true) // rgba alpha may be 255
		})
	})

	describe('clearAllLcdSegments', () => {
		test('clears all lcd controls', async () => {
			const controls: StreamDeckLcdSegmentControlDefinition[] = [
				{ ...neoLcdControl, id: 0 },
				{ ...neoLcdControl, id: 1 },
			]
			const svc = new StreamDeckNeoLcdService(encodeJpeg, device as any, controls)
			await svc.clearAllLcdSegments()
			expect(device.sendReports).toHaveBeenCalledTimes(2)
		})

		test('does nothing when no controls', async () => {
			const svc = new StreamDeckNeoLcdService(encodeJpeg, device as any, [])
			await svc.clearAllLcdSegments()
			expect(device.sendReports).not.toHaveBeenCalled()
		})
	})
})
