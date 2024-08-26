import type { StreamDeckButtonControlDefinition, StreamDeckControlDefinition } from './controlDefinition.js'
import type { Dimension } from './id.js'

export function generateButtonsGrid(
	width: number,
	height: number,
	pixelSize: Dimension,
	rtl = false,
): StreamDeckButtonControlDefinition[] {
	const controls: StreamDeckButtonControlDefinition[] = []

	for (let row = 0; row < height; row++) {
		for (let column = 0; column < width; column++) {
			const index = row * width + column
			const hidIndex = rtl ? flipKeyIndex(width, index) : index

			controls.push({
				type: 'button',
				row,
				column,
				index,
				hidIndex,
				feedbackType: 'lcd',
				pixelSize,
			})
		}
	}

	return controls
}

function flipKeyIndex(columns: number, keyIndex: number): number {
	// Horizontal flip
	const half = (columns - 1) / 2
	const diff = ((keyIndex % columns) - half) * -half
	return keyIndex + diff
}

export function freezeDefinitions(controls: StreamDeckControlDefinition[]): Readonly<StreamDeckControlDefinition[]> {
	return Object.freeze(controls.map((control) => Object.freeze(control)))
}
