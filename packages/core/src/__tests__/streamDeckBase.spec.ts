/* eslint-disable @typescript-eslint/unbound-method */

// Mock the index to break the circular dependency that occurs when importing
// models/base.ts directly (base.ts imports DEVICE_MODELS from index.ts which
// re-imports all models including galleon-k100.ts which extends StreamDeckBase).
jest.mock('../index.js', () => ({
	DEVICE_MODELS: [],
}))

import { StreamDeckBase } from '../models/base.js'
import type { StreamDeckServicesDefinition, StreamDeckProperties, OpenStreamDeckOptions } from '../models/base.js'
import type { PropertiesService } from '../services/properties/interface.js'
import type { ButtonsLcdDisplayService } from '../services/buttonsLcdDisplay/interface.js'
import type { StreamDeckInputService } from '../services/input/interface.js'
import type { LcdSegmentDisplayService } from '../services/lcdSegmentDisplay/interface.js'
import type { EncoderLedService } from '../services/encoderLed/interface.js'
import { CallbackHook } from '../services/callback-hook.js'
import type { StreamDeckEvents } from '../types.js'
import { DummyHID } from './hid.js'
import { DeviceModelId } from '../id.js'

// --- helpers ---

function makeEncodeJpeg() {
	return jest.fn(async (_b: Uint8Array, _w: number, _h: number) => new Uint8Array(0))
}

function makeDummyHID() {
	return new DummyHID('test-path', makeEncodeJpeg())
}

function makeOptions(): Required<OpenStreamDeckOptions> {
	return { encodeJPEG: makeEncodeJpeg() }
}

function makeMockProperties(): jest.Mocked<PropertiesService> {
	return {
		setBrightness: jest.fn().mockResolvedValue(undefined),
		resetToLogo: jest.fn().mockResolvedValue(undefined),
		getFirmwareVersion: jest.fn().mockResolvedValue('1.0.0'),
		getAllFirmwareVersions: jest.fn().mockResolvedValue({ AP2: '1.0.0' }),
		getSerialNumber: jest.fn().mockResolvedValue('SN12345'),
	}
}

function makeMockButtonsLcd(): jest.Mocked<ButtonsLcdDisplayService> {
	return {
		calculateFillPanelDimensions: jest.fn().mockReturnValue({ width: 360, height: 216 }),
		clearPanel: jest.fn().mockResolvedValue(undefined),
		clearKey: jest.fn().mockResolvedValue(undefined),
		fillKeyColor: jest.fn().mockResolvedValue(undefined),
		fillKeyBuffer: jest.fn().mockResolvedValue(undefined),
		prepareFillKeyBuffer: jest.fn().mockResolvedValue({ data: new Uint8Array(0) }),
		fillPanelBuffer: jest.fn().mockResolvedValue(undefined),
		prepareFillPanelBuffer: jest.fn().mockResolvedValue({ data: new Uint8Array(0) }),
	} as unknown as jest.Mocked<ButtonsLcdDisplayService>
}

function makeMockInputService(): jest.Mocked<StreamDeckInputService> {
	return { handleInput: jest.fn() }
}

function makeMockLcdSegment(): jest.Mocked<LcdSegmentDisplayService> {
	return {
		fillLcd: jest.fn().mockResolvedValue(undefined),
		fillLcdRegion: jest.fn().mockResolvedValue(undefined),
		prepareFillLcdRegion: jest.fn().mockResolvedValue({ data: new Uint8Array(0) }),
		clearLcdSegment: jest.fn().mockResolvedValue(undefined),
		clearAllLcdSegments: jest.fn().mockResolvedValue(undefined),
	} as unknown as jest.Mocked<LcdSegmentDisplayService>
}

function makeMockEncoderLed(): jest.Mocked<EncoderLedService> {
	return {
		clearAll: jest.fn().mockResolvedValue(undefined),
		setEncoderColor: jest.fn().mockResolvedValue(undefined),
		setEncoderRingSingleColor: jest.fn().mockResolvedValue(undefined),
		setEncoderRingColors: jest.fn().mockResolvedValue(undefined),
	}
}

const minimalButtonProperties: Readonly<StreamDeckProperties> = {
	MODEL: DeviceModelId.ORIGINAL,
	PRODUCT_NAME: 'Test Device',
	KEY_DATA_OFFSET: 0,
	SUPPORTS_RGB_KEY_FILL: false,
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
			row: 0,
			column: 2,
			pixelSize: { width: 72, height: 72 },
		},
	] as any,
	KEY_SPACING_HORIZONTAL: 0,
	KEY_SPACING_VERTICAL: 0,
	FULLSCREEN_PANELS: 0,
	HAS_NFC_READER: false,
	SUPPORTS_CHILD_DEVICES: false,
}

function makeServices(overrides?: Partial<StreamDeckServicesDefinition>): StreamDeckServicesDefinition {
	const events = new CallbackHook<StreamDeckEvents>()
	return {
		deviceProperties: minimalButtonProperties,
		events,
		properties: makeMockProperties(),
		buttonsLcd: makeMockButtonsLcd(),
		inputService: makeMockInputService(),
		lcdSegmentDisplay: null,
		encoderLed: null,
		...overrides,
	}
}

// --- tests ---

describe('StreamDeckBase (Phase 2 integration)', () => {
	let device: DummyHID
	let services: StreamDeckServicesDefinition
	let streamDeck: StreamDeckBase

	beforeEach(() => {
		device = makeDummyHID()
		services = makeServices()
		streamDeck = new StreamDeckBase(device, makeOptions(), services)
	})

	// ---- Properties delegation ----
	describe('properties delegation', () => {
		test('setBrightness delegates to propertiesService', async () => {
			await streamDeck.setBrightness(50)
			expect((services.properties as jest.Mocked<PropertiesService>).setBrightness).toHaveBeenCalledWith(50)
		})

		test('resetToLogo delegates to propertiesService', async () => {
			await streamDeck.resetToLogo()
			expect((services.properties as jest.Mocked<PropertiesService>).resetToLogo).toHaveBeenCalledTimes(1)
		})

		test('getFirmwareVersion delegates to propertiesService', async () => {
			const result = await streamDeck.getFirmwareVersion()
			expect(result).toBe('1.0.0')
			expect((services.properties as jest.Mocked<PropertiesService>).getFirmwareVersion).toHaveBeenCalledTimes(1)
		})

		test('getAllFirmwareVersions delegates to propertiesService', async () => {
			const result = await streamDeck.getAllFirmwareVersions()
			expect(result).toEqual({ AP2: '1.0.0' })
		})

		test('getSerialNumber delegates to propertiesService', async () => {
			const result = await streamDeck.getSerialNumber()
			expect(result).toBe('SN12345')
		})
	})

	// ---- ButtonsLcd delegation ----
	describe('buttonsLcd delegation', () => {
		test('calculateFillPanelDimensions delegates', () => {
			const result = streamDeck.calculateFillPanelDimensions()
			expect(
				(services.buttonsLcd as jest.Mocked<ButtonsLcdDisplayService>).calculateFillPanelDimensions,
			).toHaveBeenCalledWith(undefined)
			expect(result).toEqual({ width: 360, height: 216 })
		})

		test('clearKey delegates', async () => {
			await streamDeck.clearKey(0)
			expect((services.buttonsLcd as jest.Mocked<ButtonsLcdDisplayService>).clearKey).toHaveBeenCalledWith(0)
		})

		test('clearKey throws TypeError for invalid key', async () => {
			await expect(streamDeck.clearKey(99)).rejects.toThrow(TypeError)
			expect((services.buttonsLcd as jest.Mocked<ButtonsLcdDisplayService>).clearKey).not.toHaveBeenCalled()
		})

		test('fillKeyColor delegates', async () => {
			await streamDeck.fillKeyColor(1, 255, 0, 0)
			expect((services.buttonsLcd as jest.Mocked<ButtonsLcdDisplayService>).fillKeyColor).toHaveBeenCalledWith(
				1,
				255,
				0,
				0,
			)
		})

		test('fillKeyColor throws for invalid key', async () => {
			await expect(streamDeck.fillKeyColor(99, 0, 0, 0)).rejects.toThrow(TypeError)
		})

		test('fillKeyBuffer delegates (lcd key)', async () => {
			const buf = new Uint8Array(72 * 72 * 3)
			await streamDeck.fillKeyBuffer(0, buf)
			expect((services.buttonsLcd as jest.Mocked<ButtonsLcdDisplayService>).fillKeyBuffer).toHaveBeenCalledWith(
				0,
				buf,
				undefined,
			)
		})

		test('fillKeyBuffer throws for invalid key index', async () => {
			await expect(streamDeck.fillKeyBuffer(99, new Uint8Array(100))).rejects.toThrow(TypeError)
		})

		test('fillPanelBuffer delegates', async () => {
			const buf = new Uint8Array(10)
			await streamDeck.fillPanelBuffer(buf)
			expect((services.buttonsLcd as jest.Mocked<ButtonsLcdDisplayService>).fillPanelBuffer).toHaveBeenCalledWith(
				buf,
				undefined,
			)
		})
	})

	// ---- LCD segment service ----
	describe('lcdSegmentDisplay delegation', () => {
		let lcdMock: jest.Mocked<LcdSegmentDisplayService>
		let streamDeckWithLcd: StreamDeckBase

		beforeEach(() => {
			lcdMock = makeMockLcdSegment()
			streamDeckWithLcd = new StreamDeckBase(
				makeDummyHID(),
				makeOptions(),
				makeServices({ lcdSegmentDisplay: lcdMock }),
			)
		})

		test('fillLcd delegates when service exists', async () => {
			const buf = new Uint8Array(100)
			await streamDeckWithLcd.fillLcd(0, buf, { format: 'rgb' })
			expect(lcdMock.fillLcd).toHaveBeenCalledWith(0, buf, { format: 'rgb' })
		})

		test('fillLcd throws when no lcdSegmentDisplay', async () => {
			await expect(streamDeck.fillLcd(0, new Uint8Array(100), { format: 'rgb' })).rejects.toThrow('Not supported')
		})

		test('fillLcdRegion delegates', async () => {
			const buf = new Uint8Array(100)
			await streamDeckWithLcd.fillLcdRegion(0, 0, 0, buf, { format: 'rgb', width: 10, height: 10 })
			expect(lcdMock.fillLcdRegion).toHaveBeenCalledTimes(1)
		})

		test('fillLcdRegion throws when no service', async () => {
			await expect(
				streamDeck.fillLcdRegion(0, 0, 0, new Uint8Array(100), { format: 'rgb', width: 10, height: 10 }),
			).rejects.toThrow('Not supported')
		})

		test('clearLcdSegment delegates', async () => {
			await streamDeckWithLcd.clearLcdSegment(0)
			expect(lcdMock.clearLcdSegment).toHaveBeenCalledWith(0)
		})

		test('clearLcdSegment throws when no service', async () => {
			await expect(streamDeck.clearLcdSegment(0)).rejects.toThrow('Not supported')
		})
	})

	// ---- Encoder LED service ----
	describe('encoderLed delegation', () => {
		let encoderMock: jest.Mocked<EncoderLedService>
		let streamDeckWithEncoder: StreamDeckBase

		beforeEach(() => {
			encoderMock = makeMockEncoderLed()
			streamDeckWithEncoder = new StreamDeckBase(
				makeDummyHID(),
				makeOptions(),
				makeServices({ encoderLed: encoderMock }),
			)
		})

		test('setEncoderColor delegates', async () => {
			await streamDeckWithEncoder.setEncoderColor(0, 255, 0, 0)
			expect(encoderMock.setEncoderColor).toHaveBeenCalledWith(0, 255, 0, 0)
		})

		test('setEncoderColor throws when no service', async () => {
			await expect(streamDeck.setEncoderColor(0, 255, 0, 0)).rejects.toThrow('Not supported')
		})

		test('setEncoderRingSingleColor delegates', async () => {
			await streamDeckWithEncoder.setEncoderRingSingleColor(0, 100, 100, 100)
			expect(encoderMock.setEncoderRingSingleColor).toHaveBeenCalledWith(0, 100, 100, 100)
		})

		test('setEncoderRingSingleColor throws when no service', async () => {
			await expect(streamDeck.setEncoderRingSingleColor(0, 0, 0, 0)).rejects.toThrow('Not supported')
		})

		test('setEncoderRingColors delegates', async () => {
			const colors = new Uint8Array(24 * 3)
			await streamDeckWithEncoder.setEncoderRingColors(0, colors)
			expect(encoderMock.setEncoderRingColors).toHaveBeenCalledWith(0, colors)
		})
	})

	// ---- clearPanel triggers all three services ----
	describe('clearPanel', () => {
		test('clears buttonsLcd', async () => {
			await streamDeck.clearPanel()
			expect((services.buttonsLcd as jest.Mocked<ButtonsLcdDisplayService>).clearPanel).toHaveBeenCalledTimes(1)
		})

		test('clears lcdSegmentDisplay when present', async () => {
			const lcdMock = makeMockLcdSegment()
			const sd = new StreamDeckBase(makeDummyHID(), makeOptions(), makeServices({ lcdSegmentDisplay: lcdMock }))
			await sd.clearPanel()
			expect(lcdMock.clearAllLcdSegments).toHaveBeenCalledTimes(1)
		})

		test('clears encoderLed when present', async () => {
			const encoderMock = makeMockEncoderLed()
			const sd = new StreamDeckBase(makeDummyHID(), makeOptions(), makeServices({ encoderLed: encoderMock }))
			await sd.clearPanel()
			expect(encoderMock.clearAll).toHaveBeenCalledTimes(1)
		})

		test('clears all three when all present', async () => {
			const lcdMock = makeMockLcdSegment()
			const encoderMock = makeMockEncoderLed()
			const buttonsLcdMock = makeMockButtonsLcd()
			const sd = new StreamDeckBase(
				makeDummyHID(),
				makeOptions(),
				makeServices({ buttonsLcd: buttonsLcdMock, lcdSegmentDisplay: lcdMock, encoderLed: encoderMock }),
			)
			await sd.clearPanel()
			expect(buttonsLcdMock.clearPanel).toHaveBeenCalledTimes(1)
			expect(lcdMock.clearAllLcdSegments).toHaveBeenCalledTimes(1)
			expect(encoderMock.clearAll).toHaveBeenCalledTimes(1)
		})
	})

	// ---- Device wiring ----
	describe('device event wiring', () => {
		test('device input event is forwarded to inputService.handleInput', () => {
			const inputMock = services.inputService as jest.Mocked<StreamDeckInputService>
			const data = new Uint8Array([0x01, 0x00, 0x00])
			device.emit('input', data)
			expect(inputMock.handleInput).toHaveBeenCalledWith(data)
		})

		test('device error event is re-emitted on streamDeck', () => {
			const errorSpy = jest.fn()
			streamDeck.on('error', errorSpy)
			const err = new Error('test error')
			device.emit('error', err)
			expect(errorSpy).toHaveBeenCalledWith(err)
		})

		test('services.events are forwarded to streamDeck events', () => {
			const downSpy = jest.fn()
			streamDeck.on('down', downSpy)
			const control = minimalButtonProperties.CONTROLS[0] as any
			services.events.emit('down', control)
			expect(downSpy).toHaveBeenCalledWith(control)
		})
	})

	// ---- close / getHidDeviceInfo ----
	describe('device proxy methods', () => {
		test('close() delegates to device.close()', async () => {
			device.close = jest.fn().mockResolvedValue(undefined)
			await streamDeck.close()
			expect(device.close).toHaveBeenCalledTimes(1)
		})

		test('getHidDeviceInfo() delegates to device.getDeviceInfo()', async () => {
			const info = { productId: 1, vendorId: 2, path: 'x', release: 0 }
			device.getDeviceInfo = jest.fn().mockResolvedValue(info)
			const result = await streamDeck.getHidDeviceInfo()
			expect(result).toBe(info)
		})
	})
})
