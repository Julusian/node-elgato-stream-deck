import type { DeviceModelId, ChildHIDDeviceInfo, OpenStreamDeckOptions, StreamDeck } from '@elgato-stream-deck/core'
import type { JPEGEncodeOptions } from '@elgato-stream-deck/node-lib'
import type { EventEmitter } from 'eventemitter3'

export interface OpenStreamDeckOptionsTcp extends OpenStreamDeckOptions {
	/** JPEG quality options for default jpeg encoder */
	jpegOptions?: JPEGEncodeOptions
	/** Whether to auto-connect to any streamdecks discovered to be connected to a manually specified streamdeck */
	autoConnectToSecondaries?: boolean
}

export interface StreamDeckTcpEvents {
	disconnected: []
	childChange: [info: ChildHIDDeviceInfo | null]
}

export interface StreamDeckChildDeviceInfo extends ChildHIDDeviceInfo {
	readonly model: DeviceModelId
}

export interface StreamDeckTcp extends StreamDeck {
	readonly tcpEvents: EventEmitter<StreamDeckTcpEvents>

	readonly remoteAddress: string
	readonly remotePort: number

	getMacAddress(): Promise<string>
}
