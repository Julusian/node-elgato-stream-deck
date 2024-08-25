type EmitEventFn<TEvents extends { [k: string]: any[] }, K extends keyof TEvents> = (
	key: K,
	...args: TEvents[K]
) => void

/**
 * A simple helper that allows for the delayed registering of a listener, to avoid dependency cycles
 */
export class CallbackHook<TEvents extends { [k: string]: any[] }> {
	#listener: EmitEventFn<TEvents, keyof TEvents> | null = null

	emit<T extends keyof TEvents>(key: T, ...args: TEvents[T]): void {
		if (!this.#listener) throw new Error('No listener setup')

		this.#listener(key, ...args)
	}

	listen(fn: EmitEventFn<TEvents, keyof TEvents>): void {
		this.#listener = fn
	}
}
