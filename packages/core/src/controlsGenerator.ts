import type { StreamDeckButtonControlDefinition, StreamDeckControlDefinition } from './controlDefinition.js'
import type { Dimension } from './id.js'

/** Where a grid of buttons sits on the face. The gaps are listed one by one, as some models have uneven ones */
export interface ButtonsGridBounds {
	/** Distance from the left edge of the face to the first column */
	left: number
	/** Distance from the top edge of the face to the first row */
	top: number
	/** Gap between adjacent columns, either one value used for every gap or one per pair */
	columnGaps: number | readonly number[]
	/** Gap between adjacent rows, either one value used for every gap or one per pair */
	rowGaps: number | readonly number[]
}

export interface GenerateButtonsGridOptions {
	/** Whether the hid indices run right to left */
	rtl?: boolean
	columnOffset?: number
	rowOffset?: number
	/** Where the grid sits on the face */
	bounds: ButtonsGridBounds
}

export function generateButtonsGrid(
	width: number,
	height: number,
	pixelSize: Dimension,
	options: GenerateButtonsGridOptions,
): StreamDeckButtonControlDefinition[] {
	const { rtl = false, columnOffset = 0, rowOffset = 0, bounds } = options

	const columnX = gridEdges(bounds.left, pixelSize.width, bounds.columnGaps, width, 'column')
	const rowY = gridEdges(bounds.top, pixelSize.height, bounds.rowGaps, height, 'row')

	const controls: StreamDeckButtonControlDefinition[] = []

	for (let row = 0; row < height; row++) {
		for (let column = 0; column < width; column++) {
			const index = row * width + column
			const hidIndex = rtl ? flipKeyIndex(width, index) : index

			controls.push({
				id: `button-${index}`,
				type: 'button',
				row: row + rowOffset,
				column: column + columnOffset,
				index,
				hidIndex,
				feedbackType: 'lcd',
				pixelSize,

				bounds: { x: columnX[column], y: rowY[row], width: pixelSize.width, height: pixelSize.height },
			})
		}
	}

	return controls
}

/** The leading edge of each cell in one axis of a grid */
function gridEdges(
	start: number,
	size: number,
	gaps: number | readonly number[],
	count: number,
	axis: string,
): number[] {
	const eachGap = typeof gaps === 'number' ? new Array<number>(count - 1).fill(gaps) : gaps
	if (eachGap.length !== count - 1)
		throw new Error(`Expected ${count - 1} ${axis} gaps for a grid of ${count}, got ${eachGap.length}`)

	const edges = [start]
	for (const gap of eachGap) edges.push(edges[edges.length - 1] + size + gap)
	return edges
}

function flipKeyIndex(columns: number, keyIndex: number): number {
	// Horizontal flip
	const half = (columns - 1) / 2
	const diff = ((keyIndex % columns) - half) * -half
	return keyIndex + diff
}

export function freezeDefinitions(controls: StreamDeckControlDefinition[]): Readonly<StreamDeckControlDefinition[]> {
	return Object.freeze(
		controls.map((control) => {
			Object.freeze(control.bounds)
			return Object.freeze(control)
		}),
	)
}
