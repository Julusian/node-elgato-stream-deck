import { wrapBufferToPreparedBuffer, unwrapPreparedBufferToBuffer } from '../preparedBuffer.js'
import { DeviceModelId } from '../id.js'

describe('PreparedBuffer', () => {
	const testModelId = DeviceModelId.ORIGINAL
	const testType = 'test-type'

	describe('wrapBufferToPreparedBuffer and unwrapPreparedBufferToBuffer', () => {
		test('round trip - binary safe (non-JSON)', () => {
			// Create test data with various byte values including 0s and 255s
			const originalBuffers = [
				new Uint8Array([0, 1, 2, 3, 255, 254, 253]),
				new Uint8Array([128, 127, 126, 125, 100, 50, 0]),
				new Uint8Array([255, 0, 255, 0, 255, 0, 255]),
			]

			// Wrap the buffers
			const preparedBuffer = wrapBufferToPreparedBuffer(
				testModelId,
				testType,
				originalBuffers,
				false, // not JSON safe
			)

			// Unwrap the buffers
			const unwrappedBuffers = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

			// Verify the round trip is exact
			expect(unwrappedBuffers).toHaveLength(originalBuffers.length)
			for (let i = 0; i < originalBuffers.length; i++) {
				// Convert to Uint8Array for comparison as Node.js may return Buffer
				expect(new Uint8Array(unwrappedBuffers[i])).toEqual(originalBuffers[i])
			}
		})

		test('round trip - JSON safe', () => {
			// Create test data with various byte values including 0s and 255s
			const originalBuffers = [
				new Uint8Array([0, 1, 2, 3, 255, 254, 253]),
				new Uint8Array([128, 127, 126, 125, 100, 50, 0]),
				new Uint8Array([255, 0, 255, 0, 255, 0, 255]),
			]

			// Wrap the buffers with JSON safe encoding
			const preparedBuffer = wrapBufferToPreparedBuffer(
				testModelId,
				testType,
				originalBuffers,
				true, // JSON safe
			)

			// Unwrap the buffers
			const unwrappedBuffers = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

			// Verify the round trip is exact
			expect(unwrappedBuffers).toHaveLength(originalBuffers.length)
			for (let i = 0; i < originalBuffers.length; i++) {
				expect(new Uint8Array(unwrappedBuffers[i])).toEqual(originalBuffers[i])
			}
		})

		test('round trip - empty buffers', () => {
			const originalBuffers = [new Uint8Array([]), new Uint8Array([])]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, false)

			const unwrappedBuffers = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

			expect(unwrappedBuffers).toHaveLength(originalBuffers.length)
			for (let i = 0; i < originalBuffers.length; i++) {
				expect(new Uint8Array(unwrappedBuffers[i])).toEqual(originalBuffers[i])
			}
		})

		test('round trip - single byte buffers', () => {
			const originalBuffers = [new Uint8Array([0]), new Uint8Array([255]), new Uint8Array([128])]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, true)

			const unwrappedBuffers = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

			expect(unwrappedBuffers).toHaveLength(originalBuffers.length)
			for (let i = 0; i < originalBuffers.length; i++) {
				expect(new Uint8Array(unwrappedBuffers[i])).toEqual(originalBuffers[i])
			}
		})

		test('round trip - large buffers', () => {
			// Create larger test buffers
			const originalBuffers = [
				new Uint8Array(1000).map((_, i) => i % 256),
				new Uint8Array(2000).map((_, i) => (i * 2) % 256),
			]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, false)

			const unwrappedBuffers = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

			expect(unwrappedBuffers).toHaveLength(originalBuffers.length)
			for (let i = 0; i < originalBuffers.length; i++) {
				expect(new Uint8Array(unwrappedBuffers[i])).toEqual(originalBuffers[i])
			}
		})

		test('round trip - random data', () => {
			// Create buffers with random data
			const originalBuffers = [
				new Uint8Array(100).map(() => Math.floor(Math.random() * 256)),
				new Uint8Array(200).map(() => Math.floor(Math.random() * 256)),
				new Uint8Array(50).map(() => Math.floor(Math.random() * 256)),
			]

			// Test both JSON safe and non-JSON safe modes
			for (const jsonSafe of [true, false]) {
				const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, jsonSafe)

				const unwrappedBuffers = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

				expect(unwrappedBuffers).toHaveLength(originalBuffers.length)
				for (let i = 0; i < originalBuffers.length; i++) {
					expect(new Uint8Array(unwrappedBuffers[i])).toEqual(originalBuffers[i])
				}
			}
		})

		test('model ID validation', () => {
			const originalBuffers = [new Uint8Array([1, 2, 3])]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, false)

			// Should work with correct model ID
			expect(() => unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)).not.toThrow()

			// Should throw with wrong model ID
			expect(() => unwrapPreparedBufferToBuffer(DeviceModelId.MINI, preparedBuffer)).toThrow(
				'Prepared buffer is for a different model!',
			)
		})

		test('JSON serialization and deserialization', () => {
			const originalBuffers = [new Uint8Array([0, 1, 2, 3, 255, 254, 253]), new Uint8Array([128, 127, 126, 125])]

			// Create JSON-safe prepared buffer
			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, true)

			// Serialize to JSON and back
			const jsonString = JSON.stringify(preparedBuffer)
			const deserializedBuffer = JSON.parse(jsonString)

			// Unwrap the deserialized buffer
			const unwrappedBuffers = unwrapPreparedBufferToBuffer(testModelId, deserializedBuffer)

			// Verify the round trip through JSON is exact
			expect(unwrappedBuffers).toHaveLength(originalBuffers.length)
			for (let i = 0; i < originalBuffers.length; i++) {
				expect(new Uint8Array(unwrappedBuffers[i])).toEqual(originalBuffers[i])
			}
		})
	})

	describe('wrapBufferToPreparedBuffer', () => {
		test('JSON safe mode creates string arrays', () => {
			const originalBuffers = [new Uint8Array([1, 2, 3])]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, true)

			const internal = preparedBuffer as any
			expect(internal.do_not_touch).toHaveLength(1)
			expect(typeof internal.do_not_touch[0]).toBe('string')
		})

		test('non-JSON safe mode preserves Uint8Array', () => {
			const originalBuffers = [new Uint8Array([1, 2, 3])]

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, false)

			const internal = preparedBuffer as any
			expect(internal.do_not_touch).toHaveLength(1)
			expect(internal.do_not_touch[0]).toBeInstanceOf(Uint8Array)
		})
	})

	describe('unwrapPreparedBufferToBuffer', () => {
		test('throws error for invalid buffer type', () => {
			// Create a malformed prepared buffer
			const malformedBuffer = {
				if_you_change_this_you_will_break_everything: 'test',
				modelId: testModelId,
				type: testType,
				do_not_touch: [123], // Invalid type - should be string or Uint8Array
			} as any

			expect(() => unwrapPreparedBufferToBuffer(testModelId, malformedBuffer)).toThrow(
				'Prepared buffer is not a string or Uint8Array!',
			)
		})

		test('handles mixed string and Uint8Array inputs', () => {
			// Create a prepared buffer with mixed types (this could happen in edge cases)
			const testBuffer = new Uint8Array([1, 2, 3])
			const base64String = Buffer.from(testBuffer).toString('base64')

			const mixedBuffer = {
				if_you_change_this_you_will_break_everything: 'test',
				modelId: testModelId,
				type: testType,
				do_not_touch: [testBuffer, base64String],
			} as any

			const unwrappedBuffers = unwrapPreparedBufferToBuffer(testModelId, mixedBuffer)

			expect(unwrappedBuffers).toHaveLength(2)
			expect(new Uint8Array(unwrappedBuffers[0])).toEqual(testBuffer)
			expect(new Uint8Array(unwrappedBuffers[1])).toEqual(testBuffer)
		})
	})

	describe('edge cases and error conditions', () => {
		test('empty buffer array', () => {
			const originalBuffers: Uint8Array[] = []

			const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, false)

			const unwrappedBuffers = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

			expect(unwrappedBuffers).toEqual([])
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

			const unwrappedBuffers = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

			expect(unwrappedBuffers).toHaveLength(5)
			for (let i = 0; i < originalBuffers.length; i++) {
				expect(new Uint8Array(unwrappedBuffers[i])).toEqual(originalBuffers[i])
			}
		})

		test('binary data with all byte values', () => {
			// Create a buffer with all possible byte values (0-255)
			const originalBuffers = [new Uint8Array(256).map((_, i) => i)]

			for (const jsonSafe of [true, false]) {
				const preparedBuffer = wrapBufferToPreparedBuffer(testModelId, testType, originalBuffers, jsonSafe)

				const unwrappedBuffers = unwrapPreparedBufferToBuffer(testModelId, preparedBuffer)

				expect(unwrappedBuffers).toHaveLength(1)
				expect(new Uint8Array(unwrappedBuffers[0])).toEqual(originalBuffers[0])
			}
		})
	})
})
