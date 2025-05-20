export type KeyIndex = number

export type EncoderIndex = number

export type Dimension = { width: number; height: number }

export enum DeviceModelId {
	ORIGINAL = 'original',
	ORIGINALV2 = 'originalv2',
	ORIGINALMK2 = 'original-mk2',
	ORIGINALMK2SCISSOR = 'original-mk2-scissor',
	MINI = 'mini',
	XL = 'xl',
	PEDAL = 'pedal',
	PLUS = 'plus',
	NEO = 'neo',
	STUDIO = 'studio',
	MODULE6 = '6-module',
	MODULE15 = '15-module',
	MODULE32 = '32-module',
}

export const MODEL_NAMES: { [key in DeviceModelId]: string } = {
	[DeviceModelId.ORIGINAL]: 'Stream Deck',
	[DeviceModelId.MINI]: 'Stream Deck Mini',
	[DeviceModelId.XL]: 'Stream Deck XL',
	[DeviceModelId.ORIGINALV2]: 'Stream Deck',
	[DeviceModelId.ORIGINALMK2]: 'Stream Deck MK.2',
	[DeviceModelId.ORIGINALMK2SCISSOR]: 'Stream Deck MK.2 (Scissor)',
	[DeviceModelId.PLUS]: 'Stream Deck +',
	[DeviceModelId.PEDAL]: 'Stream Deck Pedal',
	[DeviceModelId.NEO]: 'Stream Deck Neo',
	[DeviceModelId.STUDIO]: 'Stream Deck Studio',
	[DeviceModelId.MODULE6]: 'Stream Deck 6 Module',
	[DeviceModelId.MODULE15]: 'Stream Deck 15 Module',
	[DeviceModelId.MODULE32]: 'Stream Deck 32 Module',
}
