export enum DeviceModelId {
	ORIGINAL,
	MINI
}

export interface DeviceModel {
	ModelId: DeviceModelId
	ProductId: number
	MaxPacketSize: number
	HalfImagePerPacket: boolean

	KeyCols: number
	KeyRows: number

	ImageSize: number
	ImageBorder: number
	ImagePPM: number
}

export const DeviceModels: DeviceModel[] = [
	{ // Original
		ModelId: DeviceModelId.ORIGINAL,
		ProductId: 0x0060,
		MaxPacketSize: 8191,
		HalfImagePerPacket: true,
		KeyCols: 5,
		KeyRows: 3,
		ImageSize: 72,
		ImageBorder: 0,
		ImagePPM: 3780
	},
	{ // Mini
		ModelId: DeviceModelId.MINI,
		ProductId: 0x0063,
		MaxPacketSize: 1024,
		HalfImagePerPacket: false,
		KeyCols: 3,
		KeyRows: 2,
		ImageSize: 72,
		ImageBorder: 4,
		ImagePPM: 2835
	}
]
