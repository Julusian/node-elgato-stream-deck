export type KeyIndex = number

export type EncoderIndex = number

export type Dimension = { width: number; height: number }

export enum DeviceModelId {
	ORIGINAL = 'original',
	ORIGINALV2 = 'originalv2',
	ORIGINALMK2 = 'original-mk2',
	MINI = 'mini',
	XL = 'xl',
	PEDAL = 'pedal',
	PLUS = 'plus',
	NEO = 'neo',
	STUDIO = 'studio',
}

export const MODEL_NAMES: { [key in DeviceModelId]: string } = {
	[DeviceModelId.ORIGINAL]: 'Stream Deck',
	[DeviceModelId.MINI]: 'Stream Deck Mini',
	[DeviceModelId.XL]: 'Stream Deck XL',
	[DeviceModelId.ORIGINALV2]: 'Stream Deck',
	[DeviceModelId.ORIGINALMK2]: 'Stream Deck MK.2',
	[DeviceModelId.PLUS]: 'Stream Deck +',
	[DeviceModelId.PEDAL]: 'Stream Deck Pedal',
	[DeviceModelId.NEO]: 'Stream Deck Neo',
	[DeviceModelId.STUDIO]: 'Stream Deck Studio',
}
