import { uint8ArrayToDataView } from '../../util.js'

export async function parseAllFirmwareVersionsHelper(reportData: {
	// Future: LD, AP1?
	ap2: Uint8Array | null
	encoderAp2: Uint8Array | null
	encoderLd: Uint8Array | null
}): Promise<Record<string, string>> {
	const decoder = new TextDecoder('ascii')

	const versions: Record<string, string> = {}

	if (reportData.ap2) {
		const ap2DataDataView = uint8ArrayToDataView(reportData.ap2)
		versions.AP2 = decoder.decode(reportData.ap2.subarray(6, 6 + 8))
		versions.AP2_CHECKSUM = ap2DataDataView.getUint32(2, false).toString(16)
	}

	if (reportData.encoderLd && (reportData.encoderLd[0] === 0x18 || reportData.encoderLd[1] === 0x18)) {
		const encoderLdDataView = uint8ArrayToDataView(reportData.encoderLd)
		versions.ENCODER_LD_1 = decoder.decode(reportData.encoderLd.subarray(2, 2 + 8))
		versions.ENCODER_LD_1_CHECKSUM = encoderLdDataView.getUint32(10, false).toString(16)
		versions.ENCODER_LD_2 = decoder.decode(reportData.encoderLd.subarray(14, 14 + 8))
		versions.ENCODER_LD_2_CHECKSUM = encoderLdDataView.getUint32(22, false).toString(16)
	}

	if (reportData.encoderAp2 && (reportData.encoderAp2[0] === 0x18 || reportData.encoderAp2[1] === 0x18)) {
		const encoderAp2DataView = uint8ArrayToDataView(reportData.encoderAp2)
		versions.ENCODER_AP2_1 = decoder.decode(reportData.encoderAp2.subarray(2, 2 + 8))
		versions.ENCODER_AP2_1_CHECKSUM = encoderAp2DataView.getUint32(10, false).toString(16)
		versions.ENCODER_AP2_2 = decoder.decode(reportData.encoderAp2.subarray(14, 14 + 8))
		versions.ENCODER_AP2_2_CHECKSUM = encoderAp2DataView.getUint32(22, false).toString(16)
	}

	return versions
}
