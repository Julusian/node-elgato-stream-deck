import { StreamDeckButtonControlDefinition, StreamDeckControlDefinition } from './controlDefinition'

export function generateButtonsGrid(width: number, height: number): StreamDeckButtonControlDefinition[] {
	const controls: StreamDeckButtonControlDefinition[] = []

	for (let row = 0; row < height; row++) {
		for (let column = 0; column < width; column++) {
			controls.push({
				type: 'button',
				row,
				column,
				index: row * width + column,
				hidIndex: row * width + column,
				feedbackType: 'lcd',
			})
		}
	}

	return controls
}

export function freezeDefinitions(controls: StreamDeckControlDefinition[]): Readonly<StreamDeckControlDefinition[]> {
	return Object.freeze(controls.map((control) => Object.freeze(control)))
}
