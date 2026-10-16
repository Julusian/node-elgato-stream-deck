import { PendingWriteTracker } from './pendingWrites.js'

function deferred(): { promise: Promise<void>; resolve: () => void } {
	let resolve!: () => void
	const promise = new Promise<void>((res) => (resolve = res))
	return { promise, resolve }
}

/** A fake device which records each write, and only sends it if the signal has not been aborted */
class FakeDevice {
	readonly sent: string[] = []

	async send(label: string, signal: AbortSignal | null): Promise<boolean> {
		if (signal?.aborted) return false
		this.sent.push(label)
		return true
	}
}

/** Perform a write which waits for `encode` before committing to the device */
async function write(
	tracker: PendingWriteTracker,
	device: FakeDevice,
	label: string,
	options: { key?: string; encode?: Promise<void>; signal?: AbortSignal; waitFor?: string[] } = {},
): Promise<boolean> {
	return tracker.run(
		options.key ?? 'key:0',
		options.signal ?? null,
		async (ctx) => {
			await options.encode
			return ctx.commit(async (writeSignal) => device.send(label, writeSignal))
		},
		options.waitFor,
	)
}

async function tick(): Promise<void> {
	await new Promise((resolve) => setImmediate(resolve))
}

describe('PendingWriteTracker', () => {
	test('sends every write to a target', async () => {
		const tracker = new PendingWriteTracker()
		const device = new FakeDevice()

		const results = await Promise.all([
			write(tracker, device, 'a'),
			write(tracker, device, 'b'),
			write(tracker, device, 'c'),
		])

		expect(results).toEqual([true, true, true])
		expect(device.sent).toEqual(['a', 'b', 'c'])
	})

	test('preserves call order when a later write is prepared faster', async () => {
		const tracker = new PendingWriteTracker()
		const device = new FakeDevice()

		const slowEncode = deferred()
		const pA = write(tracker, device, 'a', { encode: slowEncode.promise })
		const pB = write(tracker, device, 'b')

		await tick()
		expect(device.sent).toEqual([])

		slowEncode.resolve()
		await expect(Promise.all([pA, pB])).resolves.toEqual([true, true])
		expect(device.sent).toEqual(['a', 'b'])
	})

	test('writes to different targets do not wait for each other', async () => {
		const tracker = new PendingWriteTracker()
		const device = new FakeDevice()

		const slowEncode = deferred()
		const pA = write(tracker, device, 'a', { key: 'key:0', encode: slowEncode.promise })
		const pB = write(tracker, device, 'b', { key: 'key:1' })

		await expect(pB).resolves.toBe(true)
		expect(device.sent).toEqual(['b'])

		slowEncode.resolve()
		await expect(pA).resolves.toBe(true)
	})

	test('waitFor orders writes after pending writes to an overlapping target', async () => {
		const tracker = new PendingWriteTracker()
		const device = new FakeDevice()

		const slowEncode = deferred()
		const pPanel = write(tracker, device, 'panel', { key: 'panel', encode: slowEncode.promise })
		const pKey = write(tracker, device, 'key', { key: 'key:0', waitFor: ['panel'] })

		await tick()
		expect(device.sent).toEqual([])

		slowEncode.resolve()
		await expect(Promise.all([pPanel, pKey])).resolves.toEqual([true, true])
		expect(device.sent).toEqual(['panel', 'key'])
	})

	test('a signal aborted before starting skips the write', async () => {
		const tracker = new PendingWriteTracker()
		const fn = jest.fn()

		await expect(tracker.run('key:0', AbortSignal.abort(), fn)).resolves.toBe(false)
		expect(fn).not.toHaveBeenCalled()
	})

	test('a signal aborted while preparing skips the write', async () => {
		const tracker = new PendingWriteTracker()
		const device = new FakeDevice()

		const controller = new AbortController()
		const encode = deferred()
		const p = write(tracker, device, 'a', { encode: encode.promise, signal: controller.signal })
		controller.abort()
		encode.resolve()

		await expect(p).resolves.toBe(false)
		expect(device.sent).toEqual([])
	})

	test('an aborted write does not hold up later writes', async () => {
		const tracker = new PendingWriteTracker()
		const device = new FakeDevice()

		const controller = new AbortController()
		const neverEncodes = deferred()
		const pA = write(tracker, device, 'a', { encode: neverEncodes.promise, signal: controller.signal })
		const pB = write(tracker, device, 'b')

		controller.abort()
		await expect(pB).resolves.toBe(true)
		expect(device.sent).toEqual(['b'])

		neverEncodes.resolve()
		await expect(pA).resolves.toBe(false)
	})

	test('the result of send is never overridden by a later abort', async () => {
		const tracker = new PendingWriteTracker()

		const controller = new AbortController()
		const result = tracker.run('key:0', controller.signal, async (ctx) =>
			ctx.commit(async () => {
				controller.abort()
				return true
			}),
		)

		await expect(result).resolves.toBe(true)
	})

	test('the signal listener is removed once the write completes', async () => {
		const tracker = new PendingWriteTracker()
		const device = new FakeDevice()

		const controller = new AbortController()
		const addSpy = jest.spyOn(controller.signal, 'addEventListener')
		const removeSpy = jest.spyOn(controller.signal, 'removeEventListener')

		await expect(write(tracker, device, 'a', { signal: controller.signal })).resolves.toBe(true)

		expect(addSpy).toHaveBeenCalledTimes(1)
		expect(removeSpy).toHaveBeenCalledWith('abort', addSpy.mock.calls[0][1])
	})

	test('an error from the write propagates, and does not block later writes', async () => {
		const tracker = new PendingWriteTracker()
		const device = new FakeDevice()

		await expect(
			tracker.run('key:0', null, async () => {
				throw new Error('boom')
			}),
		).rejects.toThrow('boom')

		await expect(write(tracker, device, 'a')).resolves.toBe(true)
	})
})
