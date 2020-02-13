import * as fs from 'fs'
import * as path from 'path'

export function validateWriteCall(fn: any, files: string[], filter?: (data: any) => any) {
	expect(fn).toHaveBeenCalledTimes(files.length)

	for (let i = 0; i < files.length; i++) {
		// fs.writeFileSync(path.resolve(__dirname, 'fixtures', files[i]), JSON.stringify(fn.mock.calls[i][0]))
		// console.log(JSON.stringify(fn.mock.calls[i][0]))
		let data = readFixtureJSON(files[i])
		if (filter) {
			data = filter(data)
		}
		expect(fn).toHaveBeenNthCalledWith(i + 1, Buffer.from(data))
	}
}

export function readFixtureJSON(fileName: string) {
	const filePath = path.resolve(__dirname, 'fixtures', fileName)
	const fileData = fs.readFileSync(filePath)
	return JSON.parse(fileData as any)
}
