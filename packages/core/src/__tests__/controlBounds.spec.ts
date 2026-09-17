import { DEVICE_MODEL_INFO } from '../modelInfo.js'
import type { StreamDeckControlBounds } from '../controlDefinition.js'

/** The bounds are transcribed by hand, so guard the invariants a consumer drawing a device relies on */
describe('control bounds', () => {
	const models = Object.values(DEVICE_MODEL_INFO)

	function overlaps(a: StreamDeckControlBounds, b: StreamDeckControlBounds): boolean {
		return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
	}

	describe.each(models.map((model) => [model.id, model] as const))('%s', (_id, model) => {
		test('every control is within the face', () => {
			for (const { bounds } of model.controls) {
				expect(bounds.width).toBeGreaterThan(0)
				expect(bounds.height).toBeGreaterThan(0)
				expect(bounds.x).toBeGreaterThanOrEqual(0)
				expect(bounds.y).toBeGreaterThanOrEqual(0)
				expect(bounds.x + bounds.width).toBeLessThanOrEqual(model.faceSize.width)
				expect(bounds.y + bounds.height).toBeLessThanOrEqual(model.faceSize.height)
			}
		})

		test('no two controls overlap', () => {
			const collisions: string[] = []
			for (let i = 0; i < model.controls.length; i++) {
				for (let j = i + 1; j < model.controls.length; j++) {
					const a = model.controls[i]
					const b = model.controls[j]
					if (overlaps(a.bounds, b.bounds)) collisions.push(`${a.id} & ${b.id}`)
				}
			}
			expect(collisions).toEqual([])
		})

		test('the face is no larger than the controls need', () => {
			if (model.controls.length === 0) return

			// A consumer adds its own outer padding, so the face must not carry much of its own
			const right = Math.max(...model.controls.map((control) => control.bounds.x + control.bounds.width))
			const bottom = Math.max(...model.controls.map((control) => control.bounds.y + control.bounds.height))

			expect(model.faceSize.width - right).toBeLessThanOrEqual(64)
			expect(model.faceSize.height - bottom).toBeLessThanOrEqual(64)
		})

		test('a button drawn to the panel is the size of its image', () => {
			for (const control of model.controls) {
				if (control.type !== 'button' || control.feedbackType !== 'lcd') continue

				expect({ width: control.bounds.width, height: control.bounds.height }).toEqual(control.pixelSize)
			}
		})
	})
})
