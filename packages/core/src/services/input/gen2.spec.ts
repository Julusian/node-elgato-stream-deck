import { Gen2InputService } from './gen2.js'
import { CallbackHook } from '../callback-hook.js'
import type { StreamDeckProperties } from '../../models/base.js'
import type { StreamDeckEvents } from '../../types.js'
import { DeviceModelId } from '../../id.js'

function makeProperties(hasNfc = false): Readonly<StreamDeckProperties> {
	return {
		MODEL: DeviceModelId.PLUS,
		PRODUCT_NAME: 'Test Plus',
		KEY_DATA_OFFSET: 1, // gen2 button data starts at offset 1 (after the type byte)
		SUPPORTS_RGB_KEY_FILL: true,
		CONTROLS: [
			{
				type: 'button',
				index: 0,
				hidIndex: 0,
				feedbackType: 'lcd',
				row: 0,
				column: 0,
				pixelSize: { width: 120, height: 120 },
			},
			{
				type: 'button',
				index: 1,
				hidIndex: 1,
				feedbackType: 'lcd',
				row: 0,
				column: 1,
				pixelSize: { width: 120, height: 120 },
			},
			{
				type: 'lcd-segment',
				id: 0,
				row: 2,
				column: 0,
				columnSpan: 4,
				rowSpan: 1,
				pixelSize: { width: 800, height: 100 },
				drawRegions: true,
			},
			{ type: 'encoder', index: 0, hidIndex: 0, row: 3, column: 0, hasLed: false, ledRingSteps: 0 },
			{ type: 'encoder', index: 1, hidIndex: 1, row: 3, column: 1, hasLed: false, ledRingSteps: 0 },
		] as any,
		KEY_SPACING_HORIZONTAL: 0,
		KEY_SPACING_VERTICAL: 0,
		FULLSCREEN_PANELS: 0,
		HAS_NFC_READER: hasNfc,
		SUPPORTS_CHILD_DEVICES: false,
	}
}

describe('Gen2InputService', () => {
	let hook: CallbackHook<StreamDeckEvents>
	let listener: jest.Mock
	let service: Gen2InputService

	beforeEach(() => {
		hook = new CallbackHook<StreamDeckEvents>()
		listener = jest.fn()
		hook.listen(listener as any)
		service = new Gen2InputService(makeProperties(), hook)
	})

	describe('button input (type 0x00)', () => {
		test('emits down when button pressed', () => {
			// Button packet: [0x00, key0pressed, key1pressed, ...]
			const data = new Uint8Array(8)
			data[0] = 0x00
			data[1] = 1 // key 0 (KEY_DATA_OFFSET=1, hidIndex=0 → data[1+0])

			service.handleInput(data)

			expect(listener).toHaveBeenCalledWith('down', expect.objectContaining({ type: 'button', index: 0 }))
		})

		test('emits up when button released', () => {
			const press = new Uint8Array(8)
			press[0] = 0x00
			press[1] = 1
			service.handleInput(press)
			listener.mockClear()

			const release = new Uint8Array(8)
			release[0] = 0x00
			service.handleInput(release)

			expect(listener).toHaveBeenCalledWith('up', expect.objectContaining({ index: 0 }))
		})
	})

	describe('LCD input (type 0x02)', () => {
		function makeLcdPacket(subtype: number, x: number, y: number, x2 = 0, y2 = 0): Uint8Array {
			const data = new Uint8Array(16)
			const view = new DataView(data.buffer)
			data[0] = 0x02
			data[3] = subtype
			view.setUint16(5, x, true)
			view.setUint16(7, y, true)
			view.setUint16(9, x2, true)
			view.setUint16(11, y2, true)
			return data
		}

		test('subtype 1 emits lcdShortPress with correct coordinates', () => {
			service.handleInput(makeLcdPacket(1, 100, 50))

			expect(listener).toHaveBeenCalledWith(
				'lcdShortPress',
				expect.objectContaining({ type: 'lcd-segment', id: 0 }),
				{ x: 100, y: 50 },
			)
		})

		test('subtype 2 emits lcdLongPress with correct coordinates', () => {
			service.handleInput(makeLcdPacket(2, 200, 75))

			expect(listener).toHaveBeenCalledWith(
				'lcdLongPress',
				expect.objectContaining({ type: 'lcd-segment', id: 0 }),
				{ x: 200, y: 75 },
			)
		})

		test('subtype 3 emits lcdSwipe with from and to coordinates', () => {
			service.handleInput(makeLcdPacket(3, 50, 10, 400, 90))

			expect(listener).toHaveBeenCalledWith(
				'lcdSwipe',
				expect.objectContaining({ type: 'lcd-segment', id: 0 }),
				{ x: 50, y: 10 },
				{ x: 400, y: 90 },
			)
		})

		test('ignores LCD input when no lcd-segment control matches id 0', () => {
			// Service with no lcd-segment controls
			const noLcdProperties: Readonly<StreamDeckProperties> = {
				...makeProperties(),
				CONTROLS: makeProperties().CONTROLS.filter((c: any) => c.type !== 'lcd-segment') as any,
			}
			const hookNoLcd = new CallbackHook<StreamDeckEvents>()
			const listenerNoLcd = jest.fn()
			hookNoLcd.listen(listenerNoLcd as any)
			const serviceNoLcd = new Gen2InputService(noLcdProperties, hookNoLcd)

			serviceNoLcd.handleInput(makeLcdPacket(1, 0, 0))

			expect(listenerNoLcd).not.toHaveBeenCalled()
		})
	})

	describe('encoder input (type 0x03)', () => {
		test('subtype 0: emits down when encoder pressed', () => {
			const data = new Uint8Array(8)
			data[0] = 0x03
			data[3] = 0x00 // press/release
			data[4] = 1 // encoder 0 (hidIndex=0) pressed

			service.handleInput(data)

			expect(listener).toHaveBeenCalledWith('down', expect.objectContaining({ type: 'encoder', index: 0 }))
		})

		test('subtype 0: emits up when encoder released', () => {
			// Press first
			const press = new Uint8Array(8)
			press[0] = 0x03
			press[3] = 0x00
			press[4] = 1
			service.handleInput(press)
			listener.mockClear()

			// Release
			const release = new Uint8Array(8)
			release[0] = 0x03
			release[3] = 0x00
			service.handleInput(release)

			expect(listener).toHaveBeenCalledWith('up', expect.objectContaining({ type: 'encoder', index: 0 }))
		})

		test('subtype 0: no event when state unchanged', () => {
			const data = new Uint8Array(8)
			data[0] = 0x03
			data[3] = 0x00
			// All zeros = released, no change from initial state

			service.handleInput(data)

			expect(listener).not.toHaveBeenCalled()
		})

		test('subtype 1: emits rotate with positive value for CW', () => {
			const data = new Uint8Array(8)
			data[0] = 0x03
			data[3] = 0x01 // rotate
			// encoder 1 (hidIndex=1) rotates +2
			const intArray = new Int8Array(data.buffer)
			intArray[5] = 2 // data[4 + hidIndex=1] = data[5]

			service.handleInput(data)

			expect(listener).toHaveBeenCalledWith('rotate', expect.objectContaining({ index: 1 }), 2)
		})

		test('subtype 1: emits rotate with negative value for CCW', () => {
			const data = new Uint8Array(8)
			data[0] = 0x03
			data[3] = 0x01
			const intArray = new Int8Array(data.buffer)
			intArray[4] = -3 // encoder 0

			service.handleInput(data)

			expect(listener).toHaveBeenCalledWith('rotate', expect.objectContaining({ index: 0 }), -3)
		})

		test('subtype 1: no rotate event when value is 0', () => {
			const data = new Uint8Array(8)
			data[0] = 0x03
			data[3] = 0x01
			// All zero rotation values

			service.handleInput(data)

			expect(listener).not.toHaveBeenCalled()
		})

		test('subtype 0: handles two encoders independently', () => {
			const data = new Uint8Array(8)
			data[0] = 0x03
			data[3] = 0x00
			data[4] = 1 // encoder 0 (hidIndex=0)
			data[5] = 1 // encoder 1 (hidIndex=1)

			service.handleInput(data)

			expect(listener).toHaveBeenCalledTimes(2)
			expect(listener).toHaveBeenCalledWith('down', expect.objectContaining({ index: 0 }))
			expect(listener).toHaveBeenCalledWith('down', expect.objectContaining({ index: 1 }))
		})
	})

	describe('NFC input (type 0x04)', () => {
		test('emits nfcRead with decoded id string when HAS_NFC_READER is true', () => {
			const serviceNfc = new Gen2InputService(makeProperties(true), hook)

			const id = 'NFC-TAG-001'
			const data = new Uint8Array(3 + id.length)
			data[0] = 0x04
			data[1] = id.length // length low byte
			data[2] = 0 // length high byte
			for (let i = 0; i < id.length; i++) data[3 + i] = id.charCodeAt(i)

			serviceNfc.handleInput(data)

			expect(listener).toHaveBeenCalledWith('nfcRead', id)
		})

		test('does not emit nfcRead when HAS_NFC_READER is false', () => {
			const id = 'NFC-TAG-001'
			const data = new Uint8Array(3 + id.length)
			data[0] = 0x04
			data[1] = id.length

			service.handleInput(data) // service uses makeProperties(false)

			expect(listener).not.toHaveBeenCalled()
		})
	})

	describe('unknown input types', () => {
		test('silently ignores unknown type byte', () => {
			const data = new Uint8Array(8)
			data[0] = 0xff // unknown

			expect(() => service.handleInput(data)).not.toThrow()
			expect(listener).not.toHaveBeenCalled()
		})
	})
})
