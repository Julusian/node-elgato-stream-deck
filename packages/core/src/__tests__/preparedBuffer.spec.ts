import { wrapBufferToPreparedBuffer, unwrapPreparedBufferToBuffer } from '../preparedBuffer.js'
import { DeviceModelId } from '../id.js'

describe('PreparedBuffer', () => {
	const testModelId = DeviceModelId.ORIGINAL
	const testType = 'test-type'

	describe('flat (isNested: false) round trips', () => {
		test('round trip - binary safe (non-JSON)', () => {
			const originalBuffers = [
				new Uint8Array([0, 1, 2, 3, 255, 254, 253]),
				new Uint8Array([128, 127, 126, 125, 100, 50, 0]),
				new Uint8Array([255, 0, 255, 0, 255, 0, 255]),
			]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, false)
			const result = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

			expect(result.isNested).toBe(false)
			if (result.isNested) throw new Error('unexpected')

			expect(result.buffers).toHaveLength(originalBuffers.length)
			for (let i = 0; i < originalBuffers.length; i++) {
				expect(new Uint8Array(result.buffers[i])).toEqual(originalBuffers[i])
			}
		})

		test('round trip - JSON safe', () => {
			const originalBuffers = [
				new Uint8Array([0, 1, 2, 3, 255, 254, 253]),
				new Uint8Array([128, 127, 126, 125, 100, 50, 0]),
				new Uint8Array([255, 0, 255, 0, 255, 0, 255]),
			]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, true)
			const result = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

			expect(result.isNested).toBe(false)
			if (result.isNested) throw new Error('unexpected')

			expect(result.buffers).toHaveLength(originalBuffers.length)
			for (let i = 0; i < originalBuffers.length; i++) {
				expect(new Uint8Array(result.buffers[i])).toEqual(originalBuffers[i])
			}
		})

		test('round trip - empty buffers', () => {
			const originalBuffers = [new Uint8Array([]), new Uint8Array([])]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, false)
			const result = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

			expect(result.isNested).toBe(false)
			if (result.isNested) throw new Error('unexpected')

			expect(result.buffers).toHaveLength(originalBuffers.length)
			for (let i = 0; i < originalBuffers.length; i++) {
				expect(new Uint8Array(result.buffers[i])).toEqual(originalBuffers[i])
			}
		})

		test('round trip - single byte buffers', () => {
			const originalBuffers = [new Uint8Array([0]), new Uint8Array([255]), new Uint8Array([128])]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, true)
			const result = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

			expect(result.isNested).toBe(false)
			if (result.isNested) throw new Error('unexpected')

			expect(result.buffers).toHaveLength(originalBuffers.length)
			for (let i = 0; i < originalBuffers.length; i++) {
				expect(new Uint8Array(result.buffers[i])).toEqual(originalBuffers[i])
			}
		})

		test('round trip - large buffers', () => {
			const originalBuffers = [
				new Uint8Array(1000).map((_, i) => i % 256),
				new Uint8Array(2000).map((_, i) => (i * 2) % 256),
			]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, false)
			const result = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

			expect(result.isNested).toBe(false)
			if (result.isNested) throw new Error('unexpected')

			expect(result.buffers).toHaveLength(originalBuffers.length)
			for (let i = 0; i < originalBuffers.length; i++) {
				expect(new Uint8Array(result.buffers[i])).toEqual(originalBuffers[i])
			}
		})

		test('round trip - random data', () => {
			const originalBuffers = [
				new Uint8Array(100).map(() => Math.floor(Math.random() * 256)),
				new Uint8Array(200).map(() => Math.floor(Math.random() * 256)),
				new Uint8Array(50).map(() => Math.floor(Math.random() * 256)),
			]

			for (const jsonSafe of [true, false]) {
				const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, jsonSafe)
				const result = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

				expect(result.isNested).toBe(false)
				if (result.isNested) throw new Error('unexpected')

				expect(result.buffers).toHaveLength(originalBuffers.length)
				for (let i = 0; i < originalBuffers.length; i++) {
					expect(new Uint8Array(result.buffers[i])).toEqual(originalBuffers[i])
				}
			}
		})

		test('binary data with all byte values', () => {
			const originalBuffers = [new Uint8Array(256).map((_, i) => i)]

			for (const jsonSafe of [true, false]) {
				const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, jsonSafe)
				const result = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

				expect(result.isNested).toBe(false)
				if (result.isNested) throw new Error('unexpected')

				expect(result.buffers).toHaveLength(1)
				expect(new Uint8Array(result.buffers[0])).toEqual(originalBuffers[0])
			}
		})

		test('preserves buffer order', () => {
			const originalBuffers = [
				new Uint8Array([1]),
				new Uint8Array([2]),
				new Uint8Array([3]),
				new Uint8Array([4]),
				new Uint8Array([5]),
			]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, true)
			const result = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

			expect(result.isNested).toBe(false)
			if (result.isNested) throw new Error('unexpected')

			expect(result.buffers).toHaveLength(5)
			for (let i = 0; i < originalBuffers.length; i++) {
				expect(new Uint8Array(result.buffers[i])).toEqual(originalBuffers[i])
			}
		})

		test('empty buffer array', () => {
			const originalBuffers: Uint8Array[] = []

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, false)
			const result = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

			expect(result.isNested).toBe(false)
			if (result.isNested) throw new Error('unexpected')

			expect(result.buffers).toEqual([])
		})

		test('JSON serialization and deserialization', () => {
			const originalBuffers = [new Uint8Array([0, 1, 2, 3, 255, 254, 253]), new Uint8Array([128, 127, 126, 125])]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, true)
			const deserializedBuffer = JSON.parse(JSON.stringify(preparedBuffer))
			const result = unwrapPreparedBufferToBuffer(testModelId, deserializedBuffer)

			expect(result.isNested).toBe(false)
			if (result.isNested) throw new Error('unexpected')

			expect(result.buffers).toHaveLength(originalBuffers.length)
			for (let i = 0; i < originalBuffers.length; i++) {
				expect(new Uint8Array(result.buffers[i])).toEqual(originalBuffers[i])
			}
		})
	})

	describe('nested (isNested: true) round trips', () => {
		test('round trip - binary safe (non-JSON)', () => {
			const originalGroups = [[new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])], [new Uint8Array([7, 8, 9])]]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalGroups, false)
			const result = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

			expect(result.isNested).toBe(true)
			if (!result.isNested) throw new Error('unexpected')

			expect(result.groups).toHaveLength(originalGroups.length)
			for (let i = 0; i < originalGroups.length; i++) {
				expect(result.groups[i]).toHaveLength(originalGroups[i].length)
				for (let j = 0; j < originalGroups[i].length; j++) {
					expect(new Uint8Array(result.groups[i][j])).toEqual(originalGroups[i][j])
				}
			}
		})

		test('round trip - JSON safe', () => {
			const originalGroups = [
				[new Uint8Array([0, 255, 128]), new Uint8Array([1, 2, 3])],
				[new Uint8Array([4, 5, 6]), new Uint8Array([7, 8, 9])],
				[new Uint8Array([10, 11, 12])],
			]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalGroups, true)
			const result = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

			expect(result.isNested).toBe(true)
			if (!result.isNested) throw new Error('unexpected')

			expect(result.groups).toHaveLength(originalGroups.length)
			for (let i = 0; i < originalGroups.length; i++) {
				expect(result.groups[i]).toHaveLength(originalGroups[i].length)
				for (let j = 0; j < originalGroups[i].length; j++) {
					expect(new Uint8Array(result.groups[i][j])).toEqual(originalGroups[i][j])
				}
			}
		})

		test('JSON serialization and deserialization', () => {
			const originalGroups = [
				[new Uint8Array([0, 1, 2, 3, 255]), new Uint8Array([128, 127])],
				[new Uint8Array([10, 20, 30])],
			]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalGroups, true)
			const deserializedBuffer = JSON.parse(JSON.stringify(preparedBuffer))
			const result = unwrapPreparedBufferToBuffer(testModelId, deserializedBuffer)

			expect(result.isNested).toBe(true)
			if (!result.isNested) throw new Error('unexpected')

			expect(result.groups).toHaveLength(originalGroups.length)
			for (let i = 0; i < originalGroups.length; i++) {
				for (let j = 0; j < originalGroups[i].length; j++) {
					expect(new Uint8Array(result.groups[i][j])).toEqual(originalGroups[i][j])
				}
			}
		})
	})

	describe('wrapBufferToPreparedBuffer', () => {
		test('JSON safe flat mode stores strings in do_not_touch.data', () => {
			const originalBuffers = [new Uint8Array([1, 2, 3])]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, true)

			const internal = preparedBuffer as any
			expect(internal.do_not_touch.isNested).toBe(false)
			expect(internal.do_not_touch.data).toHaveLength(1)
			expect(typeof internal.do_not_touch.data[0]).toBe('string')
		})

		test('non-JSON safe flat mode preserves Uint8Array in do_not_touch.data', () => {
			const originalBuffers = [new Uint8Array([1, 2, 3])]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, false)

			const internal = preparedBuffer as any
			expect(internal.do_not_touch.isNested).toBe(false)
			expect(internal.do_not_touch.data).toHaveLength(1)
			expect(internal.do_not_touch.data[0]).toBeInstanceOf(Uint8Array)
		})

		test('JSON safe nested mode stores string[][] in do_not_touch.data', () => {
			const originalGroups = [[new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])]]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalGroups, true)

			const internal = preparedBuffer as any
			expect(internal.do_not_touch.isNested).toBe(true)
			expect(internal.do_not_touch.data).toHaveLength(1)
			expect(Array.isArray(internal.do_not_touch.data[0])).toBe(true)
			expect(typeof internal.do_not_touch.data[0][0]).toBe('string')
		})

		test('non-JSON safe nested mode preserves Uint8Array[][] in do_not_touch.data', () => {
			const originalGroups = [[new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])]]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalGroups, false)

			const internal = preparedBuffer as any
			expect(internal.do_not_touch.isNested).toBe(true)
			expect(internal.do_not_touch.data).toHaveLength(1)
			expect(Array.isArray(internal.do_not_touch.data[0])).toBe(true)
			expect(internal.do_not_touch.data[0][0]).toBeInstanceOf(Uint8Array)
		})
	})

	describe('unwrapPreparedBufferToBuffer', () => {
		test('throws error for invalid buffer type', () => {
			const malformedBuffer = {
				if_you_change_this_you_will_break_everything: 'test',
				modelId: testModelId,
				type: testType,
				do_not_touch: { isNested: false, data: [123] }, // Invalid type - should be string or Uint8Array
			} as any

			expect(() => unwrapPreparedBufferToBuffer(testModelId, malformedBuffer)).toThrow(
				'Prepared buffer is not a string or Uint8Array!',
			)
		})

		test('handles mixed string and Uint8Array inputs', () => {
			const testBuffer = new Uint8Array([1, 2, 3])
			const base64String = Buffer.from(testBuffer).toString('base64')

			const mixedBuffer = {
				if_you_change_this_you_will_break_everything: 'test',
				modelId: testModelId,
				type: testType,
				do_not_touch: { isNested: false, data: [testBuffer, base64String] },
			} as any

			const result = unwrapPreparedBufferToBuffer(testModelId, mixedBuffer)

			expect(result.isNested).toBe(false)
			if (result.isNested) throw new Error('unexpected')

			expect(result.buffers).toHaveLength(2)
			expect(new Uint8Array(result.buffers[0])).toEqual(testBuffer)
			expect(new Uint8Array(result.buffers[1])).toEqual(testBuffer)
		})

		test('model ID validation', () => {
			const originalBuffers = [new Uint8Array([1, 2, 3])]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, false)

			expect(() => unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)).not.toThrow()
			expect(() => unwrapPreparedBufferToBuffer(DeviceModelId.MINI, preparedBuffer)).toThrow(
				'Prepared buffer is for a different model!',
			)
		})
	})
})
