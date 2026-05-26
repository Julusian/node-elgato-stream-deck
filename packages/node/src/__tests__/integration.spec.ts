jest.mock('node-hid')
import { HIDAsync } from 'node-hid'
const hidOpenMock = jest.fn<Promise<HIDAsync>, [path: string]>()
HIDAsync.open = hidOpenMock as any

// Must be imported after the node-hid mock is registered.
import { openStreamDeck } from '../index.js'
import { DeviceModelId, VENDOR_ID } from '@elgato-stream-deck/core'
import { DummyHID } from '../__mocks__/hid.js'

// Stream Deck Original USB product ID (gen1, 5×3 button grid)
const ORIGINAL_PRODUCT_ID = 0x0060

describe('StreamDeckNode — integration', () => {
	const DEVICE_PATH = 'test-integration-path'

	let mockHid: DummyHID
	let closeSpy: jest.SpyInstance
	let sendFeatureReportSpy: jest.SpyInstance

	beforeEach(() => {
		mockHid = new DummyHID()
		hidOpenMock.mockResolvedValue(mockHid as any)

		mockHid.getDeviceInfo.mockResolvedValue({
			vendorId: VENDOR_ID,
			productId: ORIGINAL_PRODUCT_ID,
			release: 0,
			interface: 0,
			path: DEVICE_PATH,
		})

		closeSpy = jest.spyOn(mockHid, 'close').mockImplementation(async () => {})
		sendFeatureReportSpy = jest.spyOn(mockHid, 'sendFeatureReport').mockImplementation(async () => 0)
		jest.spyOn(mockHid, 'getFeatureReport').mockImplementation(async () => Buffer.alloc(32))
	})

	test('opens the HID device at the given path', async () => {
		const deck = await openStreamDeck(DEVICE_PATH)

		expect(deck).toBeTruthy()
		expect(hidOpenMock).toHaveBeenCalledWith(DEVICE_PATH)

		await deck.close()
	})

	test('reports the correct model for the opened device', async () => {
		const deck = await openStreamDeck(DEVICE_PATH)

		expect(deck.MODEL).toBe(DeviceModelId.ORIGINAL)

		await deck.close()
	})

	test('opened device exposes the expected button controls', async () => {
		const deck = await openStreamDeck(DEVICE_PATH)

		const buttons = deck.CONTROLS.filter((c) => c.type === 'button')
		expect(buttons).toHaveLength(15)

		await deck.close()
	})

	test('setBrightness sends a gen1 feature report to the HID device', async () => {
		const deck = await openStreamDeck(DEVICE_PATH)
		await deck.setBrightness(70)

		expect(sendFeatureReportSpy).toHaveBeenCalled()
		// Gen1 brightness report layout: [0x05, 0x55, 0xaa, 0xd1, 0x01, <percentage>, ...]
		const report: Buffer = sendFeatureReportSpy.mock.calls[0][0]
		expect(report[0]).toBe(0x05)
		expect(report[5]).toBe(70)

		await deck.close()
	})

	test('forwards HID data events as button press and release events', async () => {
		const deck = await openStreamDeck(DEVICE_PATH)
		const downSpy = jest.fn()
		const upSpy = jest.fn()
		deck.on('down', downSpy)
		deck.on('up', upSpy)

		// NodeHIDDevice filters HID 'data' events: it strips the 0x01 prefix byte and
		// emits the remainder as 'input' to the StreamDeck core.
		// For ORIGINAL (gen1): 15 key-state bytes follow the prefix byte.
		const pressReport = Buffer.alloc(17, 0)
		pressReport[0] = 0x01 // HID data prefix recognised by NodeHIDDevice
		pressReport[1] = 0x01 // first key in HID order is pressed

		const releaseReport = Buffer.alloc(17, 0)
		releaseReport[0] = 0x01 // all keys released

		mockHid.emit('data', pressReport)
		mockHid.emit('data', releaseReport)

		expect(downSpy).toHaveBeenCalledTimes(1)
		expect(upSpy).toHaveBeenCalledTimes(1)
		expect(downSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'button', index: expect.any(Number) }))

		await deck.close()
	})

	test('close with resetToLogoOnClose sends the gen1 reset command before closing', async () => {
		const deck = await openStreamDeck(DEVICE_PATH, { resetToLogoOnClose: true })
		await deck.close()

		// Gen1 resetToLogo report: [0x0b, 0x63, ...]
		expect(sendFeatureReportSpy).toHaveBeenCalled()
		const report: Buffer = sendFeatureReportSpy.mock.calls[0][0]
		expect(report[0]).toBe(0x0b)
		expect(closeSpy).toHaveBeenCalledTimes(1)
	})

	test('close without resetToLogoOnClose skips the reset command', async () => {
		const deck = await openStreamDeck(DEVICE_PATH, { resetToLogoOnClose: false })
		await deck.close()

		expect(sendFeatureReportSpy).not.toHaveBeenCalled()
		expect(closeSpy).toHaveBeenCalledTimes(1)
	})
})
