export type KeyIndex = number

export enum DeviceModelId {
	ORIGINAL = 'original',
	ORIGINALV2 = 'originalv2',
	MINI = 'mini',
	XL = 'xl',
}

export interface StreamDeckDeviceInfo {
	model: DeviceModelId
	path: string
	serialNumber?: string
}
