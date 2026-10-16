import { DEVICE_MODEL_INFO } from '../modelInfo.js'
import { DEVICE_MODELS2 } from '../registry.js'

describe('model info', () => {
	const models = Object.values(DEVICE_MODEL_INFO)

	test('snapshot', () => {
		// The data is transcribed by hand, so make every change to it visible in review
		expect(DEVICE_MODEL_INFO).toMatchSnapshot()
	})

	test('survives a json round-trip', () => {
		// toStrictEqual, as toEqual would ignore a property which is undefined
		expect(JSON.parse(JSON.stringify(DEVICE_MODEL_INFO))).toStrictEqual(DEVICE_MODEL_INFO)
	})

	test('each model is keyed by its own id', () => {
		for (const [id, model] of Object.entries(DEVICE_MODEL_INFO)) {
			expect(model.id).toBe(id)
		}
	})

	test('control ids are unique within each model', () => {
		// Consumers persist these, so a duplicate would make two controls indistinguishable
		const duplicates: string[] = []
		for (const model of models) {
			const seen = new Set<string>()
			for (const control of model.controls) {
				const key = `${control.type}:${control.id}`
				if (seen.has(key)) duplicates.push(`${model.id} ${key}`)
				seen.add(key)
			}
		}
		expect(duplicates).toEqual([])
	})

	test('usb ids are unique across models', () => {
		// Matched without the usage or interface when the caller doesn't provide them, so those can't disambiguate
		const owners = new Map<string, string>()
		const duplicates: string[] = []
		for (const model of models) {
			for (const match of model.usb) {
				const key = `${match.vendorId.toString(16)}:${match.productId.toString(16)}`
				const owner = owners.get(key)
				if (owner !== undefined) duplicates.push(`${key} (${owner} & ${model.id})`)
				owners.set(key, model.id)
			}
		}
		expect(duplicates).toEqual([])
	})

	test('agrees with DEVICE_MODELS2', () => {
		expect(Object.keys(DEVICE_MODELS2).sort()).toEqual(Object.keys(DEVICE_MODEL_INFO).sort())

		for (const model of models) {
			// Models without usb report fake ids in the legacy spec
			if (model.usb.length === 0) continue

			const legacy = DEVICE_MODELS2[model.id]
			expect(legacy.productIds).toEqual(model.usb.map((match) => match.productId))
			for (const match of model.usb) {
				expect(legacy.vendorId).toBe(match.vendorId)
			}
		}
	})
})
