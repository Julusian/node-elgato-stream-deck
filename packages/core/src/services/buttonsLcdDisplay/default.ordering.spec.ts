import { DefaultButtonsLcdService } from './default.js'
import type { HIDDevice } from '../../hid-device.js'
import type { StreamDeckProperties } from '../../models/base.js'
import type { ButtonLcdImagePacker } from '../imagePacker/interface.js'
import type { StreamdeckImageWriter } from '../imageWriter/types.js'
import { DeviceModelId } from '../../id.js'

function deferred<T = void>(): { promise: Promise<T>; resolve: (value: T) => void } {
	let resolve!: (value: T) => void
	const promise = new Promise<T>((res) => (resolve = res))
	return { promise, resolve }
}

/** A device which records each write, and only sends it if the signal has not been aborted */
function makeDevice() {
	const sent: Uint8Array[][] = []
	const device = {
		sendReports: jest.fn(async (packets: Uint8Array[], signal: AbortSignal | null) => {
			if (signal?.aborted) return false
			sent.push(packets)
			return true
		}),
		sendFeatureReport: jest.fn(async (packet: Uint8Array, signal: AbortSignal | null) => {
			if (signal?.aborted) return false
			sent.push([packet])
			return true
		}),
	} satisfies Pick<HIDDevice, 'sendReports' | 'sendFeatureReport'>
	return { device, sent }
}

/** A packer which tags the output with the first byte of the input, so the image that was sent can be identified */
function makePacker() {
	const packer = {
		convertPixelBuffer: jest.fn(async (buffer: Uint8Array | Uint8ClampedArray) => new Uint8Array([buffer[0]])),
	} satisfies ButtonLcdImagePacker
	return packer
}

const writer: StreamdeckImageWriter = {
	generateFillImageWrites: (_props, byteBuffer) => [byteBuffer],
}

const properties: Readonly<StreamDeckProperties> = {
	model: DeviceModelId.ORIGINAL,
	productName: 'Test',
	keyDataOffset: 0,
	supportsRgbKeyFill: false,
	controls: [
		{
			type: 'button',
			index: 0,
			hidIndex: 0,
			feedbackType: 'lcd',
			row: 0,
			column: 0,
			pixelSize: { width: 2, height: 2 },
		},
		{
			type: 'button',
			index: 1,
			hidIndex: 1,
			feedbackType: 'lcd',
			row: 0,
			column: 1,
			pixelSize: { width: 2, height: 2 },
		},
	] as any,
	faceSize: { width: 100, height: 100 },
	fullscreenPanels: 0,
	hasNfcReader: false,
	supportsChildDevices: false,
}

function image(tag: number): Uint8Array {
	const buffer = new Uint8Array(2 * 2 * 3)
	buffer[0] = tag
	return buffer
}

function makeService() {
	const { device, sent } = makeDevice()
	const packer = makePacker()
	const service = new DefaultButtonsLcdService(writer, packer, device, properties)
	return { service, device, sent, packer }
}

function panelImage(tag: number): Uint8Array {
	const buffer = new Uint8Array(4 * 2 * 3)
	buffer[0] = tag
	return buffer
}

describe('DefaultButtonsLcdService write ordering', () => {
	test('a slow encode of an older draw can not overwrite a newer draw', async () => {
		const { service, packer, sent } = makeService()

		const slowEncode = deferred<Uint8Array<ArrayBuffer>>()
		packer.convertPixelBuffer.mockImplementationOnce(async () => slowEncode.promise)

		const pA = service.fillKeyBuffer(0, image(1), undefined, null)
		const pB = service.fillKeyBuffer(0, image(2), undefined, null)

		await new Promise((resolve) => setImmediate(resolve))
		expect(sent).toEqual([])

		slowEncode.resolve(new Uint8Array([1]))
		await expect(Promise.all([pA, pB])).resolves.toEqual([true, true])
		expect(sent.map((p) => p[0][0])).toEqual([1, 2])
	})

	test('draws to other keys do not wait for each other', async () => {
		const { service, packer, sent } = makeService()

		const slowEncode = deferred<Uint8Array<ArrayBuffer>>()
		packer.convertPixelBuffer.mockImplementationOnce(async () => slowEncode.promise)

		const pA = service.fillKeyBuffer(0, image(1), undefined, null)
		await expect(service.fillKeyBuffer(1, image(2), undefined, null)).resolves.toBe(true)
		expect(sent.map((p) => p[0][0])).toEqual([2])

		slowEncode.resolve(new Uint8Array([1]))
		await expect(pA).resolves.toBe(true)
	})

	test('a key draw after a pending panel fill is sent after it', async () => {
		const { service, packer, sent } = makeService()

		const slowEncode = deferred<Uint8Array<ArrayBuffer>>()
		packer.convertPixelBuffer.mockImplementationOnce(async () => slowEncode.promise)

		const pPanel = service.fillPanelBuffer(panelImage(9), undefined, null)
		const pKey = service.fillKeyBuffer(1, image(2), undefined, null)

		await new Promise((resolve) => setImmediate(resolve))
		expect(sent).toEqual([])

		slowEncode.resolve(new Uint8Array([9]))
		await expect(Promise.all([pPanel, pKey])).resolves.toEqual([true, true])
		// The panel is sent as one write, followed by the key
		expect(sent).toHaveLength(2)
		expect(sent[1][0][0]).toBe(2)
	})

	test('a panel fill after a pending key draw is sent after it', async () => {
		const { service, packer, sent } = makeService()

		const slowEncode = deferred<Uint8Array<ArrayBuffer>>()
		packer.convertPixelBuffer.mockImplementationOnce(async () => slowEncode.promise)

		const pKey = service.fillKeyBuffer(1, image(2), undefined, null)
		const pPanel = service.fillPanelBuffer(panelImage(9), undefined, null)

		await new Promise((resolve) => setImmediate(resolve))
		expect(sent).toEqual([])

		slowEncode.resolve(new Uint8Array([2]))
		await expect(Promise.all([pKey, pPanel])).resolves.toEqual([true, true])
		expect(sent).toHaveLength(2)
		expect(sent[0][0][0]).toBe(2)
	})

	test('the result is true once sent, even if the signal aborts afterwards', async () => {
		const { service, device } = makeService()

		const controller = new AbortController()
		device.sendReports.mockImplementationOnce(async () => {
			controller.abort()
			return true
		})

		await expect(service.fillKeyBuffer(0, image(1), undefined, controller.signal)).resolves.toBe(true)
	})

	test('an aborted signal skips the draw without encoding it', async () => {
		const { service, sent, packer } = makeService()

		await expect(service.fillKeyBuffer(0, image(1), undefined, AbortSignal.abort())).resolves.toBe(false)
		expect(sent).toEqual([])
		expect(packer.convertPixelBuffer).not.toHaveBeenCalled()
	})

	test('clearPanel resolves true only when every key was cleared', async () => {
		const { service, device } = makeService()

		await expect(service.clearPanel(null)).resolves.toBe(true)

		device.sendReports.mockResolvedValueOnce(false)
		await expect(service.clearPanel(null)).resolves.toBe(false)
	})
})
