import { parseAllFirmwareVersionsHelper } from './all-firmware.js'

describe('parseAllFirmwareVersionsHelper', () => {
	test('returns empty object when all inputs are null', async () => {
		const result = await parseAllFirmwareVersionsHelper({ ap2: null, encoderAp2: null, encoderLd: null })
		expect(result).toEqual({})
	})

	test('parses AP2 version string from bytes 6-13', async () => {
		const ap2 = new Uint8Array(32)
		const versionStr = 'V1.2.345'
		for (let i = 0; i < 8; i++) ap2[6 + i] = versionStr.charCodeAt(i)

		const result = await parseAllFirmwareVersionsHelper({ ap2, encoderAp2: null, encoderLd: null })
		expect(result.AP2).toBe('V1.2.345')
	})

	test('parses AP2 checksum as big-endian hex from bytes 2-5', async () => {
		const ap2 = new Uint8Array(32)
		ap2[2] = 0xde
		ap2[3] = 0xad
		ap2[4] = 0xbe
		ap2[5] = 0xef

		const result = await parseAllFirmwareVersionsHelper({ ap2, encoderAp2: null, encoderLd: null })
		expect(result.AP2_CHECKSUM).toBe('deadbeef')
	})

	test('ignores encoderLd when first two bytes are not 0x18', async () => {
		const encoderLd = new Uint8Array(32)
		encoderLd[0] = 0x00
		encoderLd[1] = 0x00

		const result = await parseAllFirmwareVersionsHelper({ ap2: null, encoderAp2: null, encoderLd })
		expect(result.ENCODER_LD).toBeUndefined()
	})

	test('parses encoderLd version when byte 0 is 0x18', async () => {
		const encoderLd = new Uint8Array(32)
		encoderLd[0] = 0x18
		const versionStr = 'V1.0.000'
		for (let i = 0; i < 8; i++) encoderLd[2 + i] = versionStr.charCodeAt(i)
		encoderLd[10] = 0xca
		encoderLd[11] = 0xfe
		encoderLd[12] = 0xba
		encoderLd[13] = 0xbe

		const result = await parseAllFirmwareVersionsHelper({ ap2: null, encoderAp2: null, encoderLd })
		expect(result.ENCODER_LD).toBe('V1.0.000')
		expect(result.ENCODER_LD_CHECKSUM).toBe('cafebabe')
	})

	test('parses encoderLd version when byte 1 is 0x18', async () => {
		const encoderLd = new Uint8Array(32)
		encoderLd[1] = 0x18
		const versionStr = 'V2.1.001'
		for (let i = 0; i < 8; i++) encoderLd[2 + i] = versionStr.charCodeAt(i)

		const result = await parseAllFirmwareVersionsHelper({ ap2: null, encoderAp2: null, encoderLd })
		expect(result.ENCODER_LD).toBe('V2.1.001')
	})

	test('parses encoderAp2 when byte 0 is 0x18', async () => {
		const encoderAp2 = new Uint8Array(32)
		encoderAp2[0] = 0x18
		const versionStr = 'V2.0.001'
		for (let i = 0; i < 8; i++) encoderAp2[2 + i] = versionStr.charCodeAt(i)
		encoderAp2[10] = 0x00
		encoderAp2[11] = 0x11
		encoderAp2[12] = 0x22
		encoderAp2[13] = 0x33

		const result = await parseAllFirmwareVersionsHelper({ ap2: null, encoderAp2, encoderLd: null })
		expect(result.ENCODER_AP2).toBe('V2.0.001')
		expect(result.ENCODER_AP2_CHECKSUM).toBe('112233')
	})

	test('ignores encoderAp2 when first two bytes are not 0x18', async () => {
		const encoderAp2 = new Uint8Array(32)

		const result = await parseAllFirmwareVersionsHelper({ ap2: null, encoderAp2, encoderLd: null })
		expect(result.ENCODER_AP2).toBeUndefined()
	})

	test('parses all three fields simultaneously', async () => {
		const ap2 = new Uint8Array(32)
		const encoderLd = new Uint8Array(32)
		const encoderAp2 = new Uint8Array(32)

		const ap2Str = 'AP200001'
		for (let i = 0; i < 8; i++) ap2[6 + i] = ap2Str.charCodeAt(i)

		encoderLd[0] = 0x18
		const ldStr = 'LD000001'
		for (let i = 0; i < 8; i++) encoderLd[2 + i] = ldStr.charCodeAt(i)

		encoderAp2[1] = 0x18
		const ap2eStr = 'AP2E0001'
		for (let i = 0; i < 8; i++) encoderAp2[2 + i] = ap2eStr.charCodeAt(i)

		const result = await parseAllFirmwareVersionsHelper({ ap2, encoderAp2, encoderLd })
		expect(result.AP2).toBe('AP200001')
		expect(result.ENCODER_LD).toBe('LD000001')
		expect(result.ENCODER_AP2).toBe('AP2E0001')
	})
})
