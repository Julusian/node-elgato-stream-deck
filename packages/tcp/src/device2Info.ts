import { uint8ArrayToDataView, type StreamDeckTcpChildDeviceInfo } from '@elgato-stream-deck/core'

export function parseDevice2Info(device2Info: Uint8Array): Omit<StreamDeckTcpChildDeviceInfo, 'model'> | null {
	if (device2Info[4] !== 0x02) {
		// Nothing connected, or not OK
		return null
	}

	const dataView = uint8ArrayToDataView(device2Info)

	const vendorId = dataView.getUint16(26, true)
	const productId = dataView.getUint16(28, true)

	const serialNumberStart = 94
	const serialNumberEnd = 125
	const firstNullInSerial = device2Info.subarray(serialNumberStart, serialNumberEnd).indexOf(0x00)
	const serialNumber = new TextDecoder('ascii').decode(
		device2Info.subarray(
			serialNumberStart,
			firstNullInSerial > -1 ? serialNumberStart + firstNullInSerial : serialNumberEnd,
		),
	)

	const tcpPort = dataView.getUint16(126, true)

	return {
		serialNumber,
		tcpPort,

		vendorId,
		productId,
		path: undefined,
	}
}
