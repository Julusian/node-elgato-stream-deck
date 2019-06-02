export type KeyIndex = number

export enum DeviceModelId {
	ORIGINAL = 'original',
	MINI = 'mini',
	XL = 'xl'
}

export interface StreamDeckDeviceInfo {
	model: DeviceModelId
	path: string
	serialNumber?: string
}
