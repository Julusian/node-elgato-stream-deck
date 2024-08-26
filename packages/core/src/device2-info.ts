import { StreamDeckTcpChildDeviceInfo } from './types'

export function parseDevice2Info(device2Info: Buffer): Omit<StreamDeckTcpChildDeviceInfo, 'model'> | null {
	if (device2Info.readUInt8(4) !== 0x02) {
		// Nothing connected, or not OK
		return null
	}

	const vendorId = device2Info.readUInt16LE(26)
	const productId = device2Info.readUInt16LE(28)

	const serialNumberStart = 94
	const serialNumberEnd = 125
	const firstNullInSerial = device2Info.subarray(serialNumberStart, serialNumberEnd).indexOf(0x00)
	const serialNumber = device2Info.toString(
		'ascii',
		serialNumberStart,
		firstNullInSerial > -1 ? serialNumberStart + firstNullInSerial : serialNumberEnd
	)

	const tcpPort = device2Info.readUInt16LE(126)

	return {
		serialNumber,
		tcpPort,

		vendorId,
		productId,
		path: undefined,
	}
}
