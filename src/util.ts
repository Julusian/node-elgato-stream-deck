export function bufferToIntArray(buffer: Buffer): number[] {
	const array: number[] = []
	for (const pair of buffer.entries()) {
		array.push(pair[1])
	}
	return array
}

export function numberArrayToString(array: number[]): string {
	const end = array.indexOf(0)
	if (end !== -1) {
		array = array.slice(0, end)
	}

	return array.map(val => String.fromCharCode(val)).join('')
}
