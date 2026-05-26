import { ButtonOnlyInputService } from './gen1.js'
import { CallbackHook } from '../callback-hook.js'
import type { StreamDeckProperties } from '../../models/base.js'
import type { StreamDeckEvents } from '../../types.js'
import { DeviceModelId } from '../../id.js'

function makeProperties(keyDataOffset = 0): Readonly<StreamDeckProperties> {
	return {
		MODEL: DeviceModelId.ORIGINAL,
		PRODUCT_NAME: 'Test',
		KEY_DATA_OFFSET: keyDataOffset,
		SUPPORTS_RGB_KEY_FILL: false,
		CONTROLS: [
			{ type: 'button', index: 0, hidIndex: 0, feedbackType: 'none', row: 0, column: 0 },
			{ type: 'button', index: 1, hidIndex: 1, feedbackType: 'none', row: 0, column: 1 },
			{ type: 'button', index: 2, hidIndex: 2, feedbackType: 'none', row: 1, column: 0 },
		] as any,
		KEY_SPACING_HORIZONTAL: 0,
		KEY_SPACING_VERTICAL: 0,
		FULLSCREEN_PANELS: 0,
		HAS_NFC_READER: false,
		SUPPORTS_CHILD_DEVICES: false,
	}
}

describe('ButtonOnlyInputService', () => {
	let hook: CallbackHook<StreamDeckEvents>
	let listener: jest.Mock
	let service: ButtonOnlyInputService

	beforeEach(() => {
		hook = new CallbackHook<StreamDeckEvents>()
		listener = jest.fn()
		hook.listen(listener as any)
		service = new ButtonOnlyInputService(makeProperties(), hook)
	})

	test('emits down event when key transitions from up to pressed', () => {
		const data = new Uint8Array(3)
		data[0] = 1 // key 0 pressed

		service.handleInput(data)

		expect(listener).toHaveBeenCalledTimes(1)
		expect(listener).toHaveBeenCalledWith('down', expect.objectContaining({ type: 'button', index: 0 }))
	})

	test('emits up event when key transitions from pressed to released', () => {
		const press = new Uint8Array(3)
		press[0] = 1
		service.handleInput(press) // down
		listener.mockClear()

		const release = new Uint8Array(3)
		service.handleInput(release) // up

		expect(listener).toHaveBeenCalledTimes(1)
		expect(listener).toHaveBeenCalledWith('up', expect.objectContaining({ type: 'button', index: 0 }))
	})

	test('no events when key state does not change', () => {
		const data = new Uint8Array(3)
		service.handleInput(data) // all released → no change from initial state

		expect(listener).not.toHaveBeenCalled()
	})

	test('no duplicate down event when key is held across two packets', () => {
		const data = new Uint8Array(3)
		data[1] = 1 // key 1 held

		service.handleInput(data)
		listener.mockClear()
		service.handleInput(data) // same state

		expect(listener).not.toHaveBeenCalled()
	})

	test('multiple keys pressed simultaneously in one packet', () => {
		const data = new Uint8Array(3)
		data[0] = 1
		data[2] = 1

		service.handleInput(data)

		expect(listener).toHaveBeenCalledTimes(2)
		expect(listener).toHaveBeenCalledWith('down', expect.objectContaining({ index: 0 }))
		expect(listener).toHaveBeenCalledWith('down', expect.objectContaining({ index: 2 }))
	})

	test('passes full control definition object to event', () => {
		const data = new Uint8Array(3)
		data[1] = 1 // key 1

		service.handleInput(data)

		const control = listener.mock.calls[0][1]
		expect(control).toMatchObject({ type: 'button', index: 1, hidIndex: 1, feedbackType: 'none' })
	})

	test('respects KEY_DATA_OFFSET when reading key state', () => {
		const service2 = new ButtonOnlyInputService(makeProperties(2), hook)

		// With offset=2, key 0 state is at data[2+0]=data[2]
		const data = new Uint8Array(5)
		data[2] = 1 // key 0 at offset 2

		service2.handleInput(data)

		expect(listener).toHaveBeenCalledTimes(1)
		expect(listener).toHaveBeenCalledWith('down', expect.objectContaining({ index: 0 }))
	})

	test('emits down and up for each key independently', () => {
		const press = new Uint8Array(3)
		press[0] = 1 // key 0
		press[1] = 1 // key 1

		service.handleInput(press)
		expect(listener).toHaveBeenCalledTimes(2)
		listener.mockClear()

		const release = new Uint8Array(3)
		release[0] = 0 // key 0 released
		release[1] = 1 // key 1 still held

		service.handleInput(release)
		expect(listener).toHaveBeenCalledTimes(1)
		expect(listener).toHaveBeenCalledWith('up', expect.objectContaining({ index: 0 }))
	})
})
