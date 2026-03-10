export class QueuedCommand {
	public readonly promise: Promise<Uint8Array>
	public readonly commandType: number

	constructor(commandType: number) {
		this.commandType = commandType
		this.promise = new Promise<Uint8Array>((resolve, reject) => {
			this.resolve = resolve
			this.reject = reject
		})
	}

	resolve(_res: Uint8Array): void {
		throw new Error('No promise to resolve')
	}

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	reject(_res: any): void {
		throw new Error('No promise to reject')
	}
}
