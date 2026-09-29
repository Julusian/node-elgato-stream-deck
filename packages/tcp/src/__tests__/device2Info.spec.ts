import { parseDevice2Info } from '../device2Info.js'
import { createDevice2Info } from './helpers.js'

describe('parseDevice2Info', () => {
	test('parses a connected device', () => {
		const data = createDevice2Info({
			connected: true,
			vendorId: 0x0fd9,
			productId: 0x006c,
			serialNumber: 'A1B2C3D4E5',
			tcpPort: 5344,
		})

		expect(parseDevice2Info(data)).toEqual({
			vendorId: 0x0fd9,
			productId: 0x006c,
			serialNumber: 'A1B2C3D4E5',
			tcpPort: 5344,
			path: undefined,
		})
	})

	test.each([
		['nothing connected', 0x00],
		['an error status', 0x01],
		['an unknown status', 0x03],
	])('returns null for %s', (_name, status) => {
		const data = createDevice2Info({ connected: true, vendorId: 0x0fd9, productId: 0x006c, tcpPort: 5344 })
		data[4] = status

		expect(parseDevice2Info(data)).toBeNull()
	})

	test('reads the ids and port as little endian', () => {
		const data = createDevice2Info({ connected: true })
		data.set([0x34, 0x12], 26)
		data.set([0x78, 0x56], 28)
		data.set([0xcd, 0xab], 126)

		expect(parseDevice2Info(data)).toMatchObject({ vendorId: 0x1234, productId: 0x5678, tcpPort: 0xabcd })
	})

	test('stops the serial number at the first null', () => {
		const data = createDevice2Info({ connected: true, serialNumber: 'ABC' })
		// Junk after the terminator must be ignored
		data.write('JUNK', 94 + 4, 'ascii')

		expect(parseDevice2Info(data)?.serialNumber).toBe('ABC')
	})

	test('reads a serial number which fills the whole field', () => {
		const serialNumber = 'S'.repeat(31)
		const data = createDevice2Info({ connected: true, serialNumber, tcpPort: 0x4141 })

		const info = parseDevice2Info(data)
		expect(info?.serialNumber).toBe(serialNumber)
		// The port directly follows the serial number, and must not be read as part of it
		expect(info?.tcpPort).toBe(0x4141)
	})

	test('returns an empty serial number when none is set', () => {
		const data = createDevice2Info({ connected: true })

		expect(parseDevice2Info(data)?.serialNumber).toBe('')
	})

	test('accepts a view into a larger buffer', () => {
		const inner = createDevice2Info({ connected: true, vendorId: 0x0fd9, productId: 0x006c, tcpPort: 5344 })
		const backing = new Uint8Array(inner.length + 16)
		backing.set(inner, 8)

		expect(parseDevice2Info(backing.subarray(8, 8 + inner.length))).toMatchObject({
			vendorId: 0x0fd9,
			productId: 0x006c,
			tcpPort: 5344,
		})
	})
})
