import * as fs from 'fs'
import * as path from 'path'

export function readFixtureJSON(fileName: string): Uint8Array {
	const filePath = path.resolve(__dirname, '../../../../fixtures', fileName)
	const fileData = fs.readFileSync(filePath)
	return Buffer.from(JSON.parse(fileData.toString()) as Array<number>)
}
