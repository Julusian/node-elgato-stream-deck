import * as fs from 'fs'
import * as path from 'path'

export function validateWriteCall(fn: any, files: string[], filter?: (data: any) => any) {
	expect(fn).toHaveBeenCalledTimes(2)

	for (let i = 0; i < files.length; i++) {
		let data = readFixtureJSON(files[i])
		if (filter) {
			data = filter(data)
		}
		expect(fn).toHaveBeenNthCalledWith(i + 1, data)
	}
}

export function readFixtureJSON(fileName: string) {
	const filePath = path.resolve(__dirname, 'fixtures', fileName)
	const fileData = fs.readFileSync(filePath)
	return JSON.parse(fileData as any)
}
