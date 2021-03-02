import * as fs from 'fs'
import * as path from 'path'

export function readFixtureJSON(fileName: string): Buffer {
	const filePath = path.resolve(__dirname, '../../../../fixtures', fileName)
	const fileData = fs.readFileSync(filePath)
	return Buffer.from(JSON.parse(fileData as any))
}
