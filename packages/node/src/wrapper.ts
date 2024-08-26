import type { StreamDeck } from '@elgato-stream-deck/core'
import { StreamDeckProxy } from '@elgato-stream-deck/core'

export class StreamDeckNode extends StreamDeckProxy {
	constructor(
		device: StreamDeck,
		private readonly resetToLogoOnClose: boolean,
	) {
		super(device, (device) => new StreamDeckNode(device, this.resetToLogoOnClose))
	}

	public async close(): Promise<void> {
		if (this.resetToLogoOnClose) {
			await this.resetToLogo()
		}
		await super.close()
	}
}
