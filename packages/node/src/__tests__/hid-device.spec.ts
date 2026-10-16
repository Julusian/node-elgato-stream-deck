import { DummyHID } from '../__mocks__/hid.js'
import { NodeHIDDevice } from '../hid-device.js'

function deferred(): { promise: Promise<void>; resolve: () => void } {
	let resolve!: () => void
	const promise = new Promise<void>((res) => (resolve = res))
	return { promise, resolve }
}

describe('NodeHIDDevice write queue', () => {
	let hid: DummyHID
	let device: NodeHIDDevice

	beforeEach(() => {
		hid = new DummyHID()
		device = new NodeHIDDevice(hid)
	})

	test('sendReports resolves true once written', async () => {
		const writeSpy = jest.spyOn(hid, 'write').mockResolvedValue(1)

		await expect(device.sendReports([new Uint8Array([1, 2]), new Uint8Array([3, 4])], null)).resolves.toBe(true)
		expect(writeSpy).toHaveBeenCalledTimes(2)
	})

	test('sendReports skips a queued write whose signal is aborted before it starts', async () => {
		const blockFirst = deferred()
		const writeSpy = jest.spyOn(hid, 'write').mockImplementationOnce(async () => {
			await blockFirst.promise
			return 1
		})
		writeSpy.mockResolvedValue(1)

		const controller = new AbortController()
		const pFirst = device.sendReports([new Uint8Array([1])], null)
		const pSecond = device.sendReports([new Uint8Array([2]), new Uint8Array([3])], controller.signal)

		controller.abort()
		blockFirst.resolve()

		await expect(Promise.all([pFirst, pSecond])).resolves.toEqual([true, false])
		expect(writeSpy).toHaveBeenCalledTimes(1)
	})

	test('sendReports is never interrupted once started', async () => {
		const controller = new AbortController()
		const blockFirst = deferred()
		const writeSpy = jest
			.spyOn(hid, 'write')
			.mockImplementationOnce(async () => {
				controller.abort()
				await blockFirst.promise
				return 1
			})
			.mockResolvedValue(1)

		const p = device.sendReports([new Uint8Array([1]), new Uint8Array([2])], controller.signal)
		blockFirst.resolve()

		await expect(p).resolves.toBe(true)
		expect(writeSpy).toHaveBeenCalledTimes(2)
	})

	test('sendFeatureReport skips a queued write whose signal is aborted before it starts', async () => {
		const blockFirst = deferred()
		const featureSpy = jest.spyOn(hid, 'sendFeatureReport').mockImplementationOnce(async () => {
			await blockFirst.promise
			return 1
		})
		featureSpy.mockResolvedValue(1)

		const controller = new AbortController()
		const pFirst = device.sendFeatureReport(new Uint8Array([3, 1]), null)
		const pSecond = device.sendFeatureReport(new Uint8Array([3, 2]), controller.signal)

		controller.abort()
		blockFirst.resolve()

		await expect(Promise.all([pFirst, pSecond])).resolves.toEqual([true, false])
		expect(featureSpy).toHaveBeenCalledTimes(1)
	})
})
