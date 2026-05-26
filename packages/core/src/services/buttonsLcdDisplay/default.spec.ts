/* eslint-disable @typescript-eslint/unbound-method */
import { DefaultButtonsLcdService } from './default.js'
import type { HIDDevice } from '../../hid-device.js'
import type { StreamDeckProperties } from '../../models/base.js'
import type { ButtonLcdImagePacker } from '../imagePacker/interface.js'
import type { StreamdeckImageWriter } from '../imageWriter/types.js'
import { DeviceModelId } from '../../id.js'

function makeMockDevice(): jest.Mocked<Pick<HIDDevice, 'sendFeatureReport' | 'sendReports'>> {
	return {
		sendFeatureReport: jest.fn().mockResolvedValue(undefined),
		sendReports: jest.fn().mockResolvedValue(undefined),
	} as any
}

function makeMockPacker(): jest.Mocked<ButtonLcdImagePacker> {
	return {
		convertPixelBuffer: jest.fn().mockResolvedValue(new Uint8Array(100)),
	}
}

function makeMockWriter(): jest.Mocked<StreamdeckImageWriter> {
	return {
		generateFillImageWrites: jest.fn().mockReturnValue([new Uint8Array(1024)]),
	}
}

// 2x2 grid of 72x72 LCD buttons, no RGB key fill
function makeLcdProperties(supportsRgbKeyFill = false, fullscreenPanels = 0): Readonly<StreamDeckProperties> {
	return {
		MODEL: DeviceModelId.ORIGINAL,
		PRODUCT_NAME: 'Test',
		KEY_DATA_OFFSET: 0,
		SUPPORTS_RGB_KEY_FILL: supportsRgbKeyFill,
		CONTROLS: [
			{
				type: 'button',
				index: 0,
				hidIndex: 0,
				feedbackType: 'lcd',
				row: 0,
				column: 0,
				pixelSize: { width: 72, height: 72 },
			},
			{
				type: 'button',
				index: 1,
				hidIndex: 1,
				feedbackType: 'lcd',
				row: 0,
				column: 1,
				pixelSize: { width: 72, height: 72 },
			},
			{
				type: 'button',
				index: 2,
				hidIndex: 2,
				feedbackType: 'lcd',
				row: 1,
				column: 0,
				pixelSize: { width: 72, height: 72 },
			},
			{
				type: 'button',
				index: 3,
				hidIndex: 3,
				feedbackType: 'lcd',
				row: 1,
				column: 1,
				pixelSize: { width: 72, height: 72 },
			},
		] as any,
		KEY_SPACING_HORIZONTAL: 0,
		KEY_SPACING_VERTICAL: 0,
		FULLSCREEN_PANELS: fullscreenPanels,
		HAS_NFC_READER: false,
		SUPPORTS_CHILD_DEVICES: false,
	}
}

// 3-key RGB device
function makeRgbProperties(): Readonly<StreamDeckProperties> {
	return {
		MODEL: DeviceModelId.ORIGINAL,
		PRODUCT_NAME: 'Test RGB',
		KEY_DATA_OFFSET: 0,
		SUPPORTS_RGB_KEY_FILL: true,
		CONTROLS: [
			{ type: 'button', index: 0, hidIndex: 0, feedbackType: 'rgb', row: 0, column: 0 },
			{ type: 'button', index: 1, hidIndex: 1, feedbackType: 'rgb', row: 0, column: 1 },
			{ type: 'button', index: 2, hidIndex: 2, feedbackType: 'rgb', row: 0, column: 2 },
		] as any,
		KEY_SPACING_HORIZONTAL: 0,
		KEY_SPACING_VERTICAL: 0,
		FULLSCREEN_PANELS: 0,
		HAS_NFC_READER: false,
		SUPPORTS_CHILD_DEVICES: false,
	}
}

describe('DefaultButtonsLcdService', () => {
	let device: ReturnType<typeof makeMockDevice>
	let packer: jest.Mocked<ButtonLcdImagePacker>
	let writer: jest.Mocked<StreamdeckImageWriter>

	beforeEach(() => {
		device = makeMockDevice()
		packer = makeMockPacker()
		writer = makeMockWriter()
	})

	describe('calculateFillPanelDimensions', () => {
		test('returns correct dimensions for a 2x2 grid of 72x72 buttons', () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeLcdProperties())
			const result = service.calculateFillPanelDimensions(undefined)
			expect(result).toEqual({ width: 144, height: 144 }) // 2 cols * 72, 2 rows * 72
		})

		test('returns null when no LCD buttons exist', () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeRgbProperties())
			const result = service.calculateFillPanelDimensions(undefined)
			expect(result).toBeNull()
		})

		test('returns correct dimensions for a single LCD button', () => {
			const props: Readonly<StreamDeckProperties> = {
				...makeLcdProperties(),
				CONTROLS: [
					{
						type: 'button',
						index: 0,
						hidIndex: 0,
						feedbackType: 'lcd',
						row: 0,
						column: 0,
						pixelSize: { width: 96, height: 96 },
					},
				] as any,
			}
			const service = new DefaultButtonsLcdService(writer, packer, device as any, props)
			expect(service.calculateFillPanelDimensions(undefined)).toEqual({ width: 96, height: 96 })
		})
	})

	describe('clearPanel', () => {
		test('FULLSCREEN_PANELS > 0: sends sendFeatureReport per panel with index', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeLcdProperties(false, 2))
			await service.clearPanel()

			expect(device.sendFeatureReport).toHaveBeenCalledTimes(2)
			expect(device.sendFeatureReport).toHaveBeenCalledWith(new Uint8Array([0x03, 0x05, 0, 0, 0, 0]))
			expect(device.sendFeatureReport).toHaveBeenCalledWith(new Uint8Array([0x03, 0x05, 1, 0, 0, 0]))
		})

		test('RGB buttons: calls sendFeatureReport([0x03,0x06,hidIndex,0,0,0]) for each', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeRgbProperties())
			await service.clearPanel()

			expect(device.sendFeatureReport).toHaveBeenCalledTimes(3)
			expect(device.sendFeatureReport).toHaveBeenCalledWith(new Uint8Array([0x03, 0x06, 0, 0, 0, 0]))
			expect(device.sendFeatureReport).toHaveBeenCalledWith(new Uint8Array([0x03, 0x06, 1, 0, 0, 0]))
			expect(device.sendFeatureReport).toHaveBeenCalledWith(new Uint8Array([0x03, 0x06, 2, 0, 0, 0]))
		})

		test('LCD buttons with RGB key fill: uses sendFeatureReport, not image fill', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeLcdProperties(true))
			await service.clearPanel()

			expect(device.sendFeatureReport).toHaveBeenCalledTimes(4)
			expect(packer.convertPixelBuffer).not.toHaveBeenCalled()
		})

		test('LCD buttons without RGB key fill: fills each with black image via packer+writer', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeLcdProperties(false))
			await service.clearPanel()

			// 4 LCD buttons, each needs packer+writer
			expect(packer.convertPixelBuffer).toHaveBeenCalledTimes(4)
			expect(writer.generateFillImageWrites).toHaveBeenCalledTimes(4)
			expect(device.sendReports).toHaveBeenCalledTimes(4)
		})

		test('none-feedback buttons are skipped', async () => {
			const props: Readonly<StreamDeckProperties> = {
				...makeLcdProperties(),
				CONTROLS: [{ type: 'button', index: 0, hidIndex: 0, feedbackType: 'none', row: 0, column: 0 }] as any,
			}
			const service = new DefaultButtonsLcdService(writer, packer, device as any, props)
			await service.clearPanel()

			expect(device.sendFeatureReport).not.toHaveBeenCalled()
			expect(packer.convertPixelBuffer).not.toHaveBeenCalled()
		})
	})

	describe('clearKey', () => {
		test('RGB key: sends sendFeatureReport([0x03,0x06,hidIndex,0,0,0])', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeRgbProperties())
			await service.clearKey(1)

			expect(device.sendFeatureReport).toHaveBeenCalledWith(new Uint8Array([0x03, 0x06, 1, 0, 0, 0]))
		})

		test('LCD key with SUPPORTS_RGB_KEY_FILL: uses sendFeatureReport', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeLcdProperties(true))
			await service.clearKey(0)

			expect(device.sendFeatureReport).toHaveBeenCalledWith(new Uint8Array([0x03, 0x06, 0, 0, 0, 0]))
			expect(packer.convertPixelBuffer).not.toHaveBeenCalled()
		})

		test('LCD key without SUPPORTS_RGB_KEY_FILL: uses image fill', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeLcdProperties(false))
			await service.clearKey(0)

			expect(packer.convertPixelBuffer).toHaveBeenCalledTimes(1)
			expect(writer.generateFillImageWrites).toHaveBeenCalledTimes(1)
			expect(device.sendReports).toHaveBeenCalledTimes(1)
		})

		test('throws for invalid key index', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeLcdProperties())
			await expect(service.clearKey(99)).rejects.toThrow(TypeError)
		})

		test('throws for none-feedback key', async () => {
			const props: Readonly<StreamDeckProperties> = {
				...makeLcdProperties(),
				CONTROLS: [{ type: 'button', index: 0, hidIndex: 0, feedbackType: 'none', row: 0, column: 0 }] as any,
			}
			const service = new DefaultButtonsLcdService(writer, packer, device as any, props)
			await expect(service.clearKey(0)).rejects.toThrow(TypeError)
		})
	})

	describe('fillKeyColor', () => {
		test('RGB key: sends sendFeatureReport with correct color bytes', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeRgbProperties())
			await service.fillKeyColor(0, 255, 128, 64)

			expect(device.sendFeatureReport).toHaveBeenCalledWith(new Uint8Array([0x03, 0x06, 0, 255, 128, 64]))
		})

		test('LCD key with SUPPORTS_RGB_KEY_FILL: uses sendFeatureReport', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeLcdProperties(true))
			await service.fillKeyColor(1, 10, 20, 30)

			expect(device.sendFeatureReport).toHaveBeenCalledWith(new Uint8Array([0x03, 0x06, 1, 10, 20, 30]))
		})

		test('LCD key without SUPPORTS_RGB_KEY_FILL: renders solid color via image fill', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeLcdProperties(false))
			await service.fillKeyColor(0, 100, 150, 200)

			expect(packer.convertPixelBuffer).toHaveBeenCalledTimes(1)
			expect(writer.generateFillImageWrites).toHaveBeenCalledTimes(1)
			expect(device.sendReports).toHaveBeenCalledTimes(1)
		})

		test('throws TypeError when r is out of 0-255 range', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeRgbProperties())
			await expect(service.fillKeyColor(0, 256, 0, 0)).rejects.toThrow(TypeError)
			await expect(service.fillKeyColor(0, -1, 0, 0)).rejects.toThrow(TypeError)
		})

		test('throws TypeError when g is out of range', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeRgbProperties())
			await expect(service.fillKeyColor(0, 0, 256, 0)).rejects.toThrow(TypeError)
		})

		test('throws TypeError when b is out of range', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeRgbProperties())
			await expect(service.fillKeyColor(0, 0, 0, 256)).rejects.toThrow(TypeError)
		})

		test('throws for none-feedback key', async () => {
			const props: Readonly<StreamDeckProperties> = {
				...makeLcdProperties(),
				CONTROLS: [{ type: 'button', index: 0, hidIndex: 0, feedbackType: 'none', row: 0, column: 0 }] as any,
			}
			const service = new DefaultButtonsLcdService(writer, packer, device as any, props)
			await expect(service.fillKeyColor(0, 0, 0, 0)).rejects.toThrow(TypeError)
		})
	})

	describe('fillKeyBuffer', () => {
		test('calls packer.convertPixelBuffer and writer.generateFillImageWrites with correct args', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeLcdProperties())
			const size = 72 * 72 * 3
			const buffer = new Uint8Array(size)

			await service.fillKeyBuffer(0, buffer)

			expect(packer.convertPixelBuffer).toHaveBeenCalledTimes(1)
			expect(packer.convertPixelBuffer).toHaveBeenCalledWith(buffer, expect.objectContaining({ format: 'rgb' }), {
				width: 72,
				height: 72,
			})
			expect(writer.generateFillImageWrites).toHaveBeenCalledWith({ keyIndex: 0 }, expect.any(Uint8Array))
			expect(device.sendReports).toHaveBeenCalledTimes(1)
		})

		test('throws RangeError when buffer size does not match expected', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeLcdProperties())
			const wrongSize = new Uint8Array(10)
			await expect(service.fillKeyBuffer(0, wrongSize)).rejects.toThrow(RangeError)
		})

		test('throws TypeError for key with non-lcd feedbackType', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeRgbProperties())
			const buffer = new Uint8Array(100)
			await expect(service.fillKeyBuffer(0, buffer)).rejects.toThrow(TypeError)
		})

		test('throws TypeError for invalid key index', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeLcdProperties())
			const buffer = new Uint8Array(100)
			await expect(service.fillKeyBuffer(99, buffer)).rejects.toThrow(TypeError)
		})

		test('respects format option (rgba buffer = 72*72*4)', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeLcdProperties())
			const rgbaBuffer = new Uint8Array(72 * 72 * 4)

			await service.fillKeyBuffer(0, rgbaBuffer, { format: 'rgba' })

			expect(packer.convertPixelBuffer).toHaveBeenCalledWith(
				rgbaBuffer,
				expect.objectContaining({ format: 'rgba' }),
				{ width: 72, height: 72 },
			)
		})
	})

	describe('fillPanelBuffer', () => {
		test('calls packer+writer for each LCD button in the panel', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeLcdProperties())
			// 2x2 panel = 144x144 pixels, rgb = 144*144*3
			const buffer = new Uint8Array(144 * 144 * 3)

			await service.fillPanelBuffer(buffer)

			expect(packer.convertPixelBuffer).toHaveBeenCalledTimes(4)
			expect(writer.generateFillImageWrites).toHaveBeenCalledTimes(4)
		})

		test('throws RangeError when buffer does not match panel dimensions', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeLcdProperties())
			const wrongBuffer = new Uint8Array(100)
			await expect(service.fillPanelBuffer(wrongBuffer)).rejects.toThrow(RangeError)
		})

		test('throws when device has no LCD buttons', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeRgbProperties())
			const buffer = new Uint8Array(100)
			await expect(service.fillPanelBuffer(buffer)).rejects.toThrow()
		})
	})

	describe('checkSourceFormat', () => {
		test('accepts valid formats: rgb, rgba, bgr, bgra', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeLcdProperties())
			const size = 72 * 72
			for (const [format, stride] of [
				['rgb', 3],
				['rgba', 4],
				['bgr', 3],
				['bgra', 4],
			] as const) {
				const buffer = new Uint8Array(size * stride)
				await expect(service.fillKeyBuffer(0, buffer, { format })).resolves.not.toThrow()
			}
		})

		test('throws TypeError for unknown format', async () => {
			const service = new DefaultButtonsLcdService(writer, packer, device as any, makeLcdProperties())
			const buffer = new Uint8Array(72 * 72 * 3)
			await expect(service.fillKeyBuffer(0, buffer, { format: 'xyz' as any })).rejects.toThrow(TypeError)
		})
	})
})
