import type { DeviceModelId } from './id.js'

/**
 * This represents a buffer that has been prepared for sending to a Stream Deck.
 * Note: The result is only guaranteed to be valid for this specific StreamDeck and the same library version, but is safe to store externally.
 * If it sent to the wrong model, the result is undefined behaviour.
 *
 * This is an opaque type, and should not be viewed/inspected directly.
 *
 * It may be serialized to JSON, but only if it was generated with the `jsonSafe` flag set to `true`.
 */
export interface PreparedBuffer {
	readonly __internal__: never
}

interface PreparedButtonDrawInternal {
	if_you_change_this_you_will_break_everything: string
	modelId: DeviceModelId
	type: string
	do_not_touch: Uint8Array[] | string[]
}

export function wrapBufferToPreparedBuffer(
	modelId: DeviceModelId,
	type: string,
	buffers: Uint8Array[],
	jsonSafe: boolean,
): PreparedBuffer {
	let encodedBuffers: PreparedButtonDrawInternal['do_not_touch'] = buffers

	if (jsonSafe) {
		const decoder = new TextDecoder()
		encodedBuffers = buffers.map((b) => decoder.decode(b))
	}

	return {
		if_you_change_this_you_will_break_everything:
			'This is a encoded form of the buffer, exactly as the Stream Deck expects it. Do not touch this object, or you can crash your stream deck',
		modelId,
		type,
		do_not_touch: encodedBuffers,
	} satisfies PreparedButtonDrawInternal as any
}

export function unwrapPreparedBufferToBuffer(
	modelId: DeviceModelId,
	// type: string,
	prepared: PreparedBuffer,
): Uint8Array[] {
	const preparedInternal = prepared as any as PreparedButtonDrawInternal
	if (preparedInternal.modelId !== modelId) throw new Error('Prepared buffer is for a different model!')

	// if (preparedInternal.type !== type) throw new Error('Prepared buffer is for a different type!')

	return preparedInternal.do_not_touch.map((b) => {
		if (typeof b === 'string') {
			return new TextEncoder().encode(b)
		} else if (b instanceof Uint8Array) {
			return b
		} else {
			throw new Error('Prepared buffer is not a string or Uint8Array!')
		}
	})
}
