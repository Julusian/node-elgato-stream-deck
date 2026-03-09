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
	do_not_touch:
		| { isNested: false; data: Uint8Array[] | string[] }
		| { isNested: true; data: Uint8Array[][] | string[][] }
}

export type UnwrappedPreparedBuffer =
	| { isNested: false; buffers: Uint8Array[] }
	| { isNested: true; groups: Uint8Array[][] }

export function wrapBufferToPreparedBuffer(
	modelId: DeviceModelId,
	type: string,
	buffers: Uint8Array[] | Uint8Array[][],
	jsonSafe: boolean,
): PreparedBuffer {
	const isNested = buffers.length > 0 && Array.isArray(buffers[0])

	let doNotTouch: PreparedButtonDrawInternal['do_not_touch']

	if (jsonSafe) {
		// Use Base64 encoding for binary-safe string conversion
		const encodeOne = (b: Uint8Array): string => {
			if (typeof Buffer !== 'undefined') {
				return Buffer.from(b).toString('base64')
			} else {
				return btoa(String.fromCharCode(...b))
			}
		}
		if (isNested) {
			doNotTouch = { isNested: true, data: (buffers as Uint8Array[][]).map((group) => group.map(encodeOne)) }
		} else {
			doNotTouch = { isNested: false, data: (buffers as Uint8Array[]).map(encodeOne) }
		}
	} else {
		if (isNested) {
			doNotTouch = { isNested: true, data: buffers as Uint8Array[][] }
		} else {
			doNotTouch = { isNested: false, data: buffers as Uint8Array[] }
		}
	}

	return {
		if_you_change_this_you_will_break_everything:
			'This is a encoded form of the buffer, exactly as the Stream Deck expects it. Do not touch this object, or you can crash your stream deck',
		modelId,
		type,
		do_not_touch: doNotTouch,
	} satisfies PreparedButtonDrawInternal as any
}

export function unwrapPreparedBufferToBuffer(
	modelId: DeviceModelId,
	// type: string,
	prepared: PreparedBuffer,
): UnwrappedPreparedBuffer {
	const preparedInternal = prepared as any as PreparedButtonDrawInternal
	if (preparedInternal.modelId !== modelId) throw new Error('Prepared buffer is for a different model!')

	// if (preparedInternal.type !== type) throw new Error('Prepared buffer is for a different type!')

	const decodeOne = (b: Uint8Array | string): Uint8Array => {
		if (typeof b === 'string') {
			// Decode from Base64 for binary-safe conversion
			if (typeof Buffer !== 'undefined') {
				// Fast path for Node.js
				return Buffer.from(b, 'base64')
			} else {
				// Browser fallback
				return new Uint8Array(
					atob(b)
						.split('')
						.map((char) => char.charCodeAt(0)),
				)
			}
		} else if (b instanceof Uint8Array) {
			return b
		} else {
			throw new Error('Prepared buffer is not a string or Uint8Array!')
		}
	}

	const doNotTouch = preparedInternal.do_not_touch
	if (doNotTouch.isNested) {
		return { isNested: true, groups: doNotTouch.data.map((group) => group.map(decodeOne)) }
	} else {
		return { isNested: false, buffers: doNotTouch.data.map(decodeOne) }
	}
}
