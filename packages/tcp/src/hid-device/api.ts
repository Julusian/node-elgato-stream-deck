import type { HIDDevice, StreamDeckTcpChildDeviceInfo } from '@elgato-stream-deck/core'

export interface TcpHidDevice extends HIDDevice {
	readonly isPrimary: boolean

	set onChildInfoChange(cb: ((info: Omit<StreamDeckTcpChildDeviceInfo, 'model'> | null) => void) | null)
}
