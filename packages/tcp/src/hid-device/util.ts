export class QueuedCommand {
	public readonly promise: Promise<Buffer>
	public readonly commandType: number

	constructor(commandType: number) {
		this.commandType = commandType
		this.promise = new Promise<Buffer>((resolve, reject) => {
			this.resolve = resolve
			this.reject = reject
		})
	}

	resolve(_res: Buffer): void {
		throw new Error('No promise to resolve')
	}

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	reject(_res: any): void {
		throw new Error('No promise to reject')
	}
}
