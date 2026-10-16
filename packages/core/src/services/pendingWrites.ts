export interface PendingWriteContext {
	/** The caller's signal to abort the write, if any */
	readonly signal: AbortSignal | null
	/**
	 * Hand the write to the device.
	 * This waits for any earlier writes to the same target to be handed to the device first, so that writes can never be reordered by differing encode times.
	 * If the signal has been aborted by then, `send` is not called and this resolves false.
	 * Otherwise this resolves with the result of `send` unchanged, so that `true` is always reported once something has been sent.
	 * Must only be called once per write.
	 */
	commit(send: (signal: AbortSignal | null) => Promise<boolean>): Promise<boolean>
}

interface PendingWriteEntry {
	/** Resolves once this write has been handed to the device, or once it will never be */
	readonly committed: Promise<void>
}

/**
 * Tracks the in-progress writes for each target (eg a key), to ensure that writes to a target are handed to the device in the order they were made.
 * Without this, a slow image encode for one write could cause it to be sent after a newer write to the same target.
 */
export class PendingWriteTracker {
	readonly #targets = new Map<string, Set<PendingWriteEntry>>()

	/**
	 * Perform a write to a target, tracking it until it completes
	 * @param key The target being written to
	 * @param signal Signal provided by the caller to abort the write
	 * @param fn The write. It should prepare the data, then call `ctx.commit` to send it
	 * @param waitFor Other targets which overlap this one, whose pending writes must be sent before this one
	 * @returns Whether the write was sent to the device
	 */
	async run(
		key: string,
		signal: AbortSignal | null,
		fn: (ctx: PendingWriteContext) => Promise<boolean>,
		waitFor?: string[],
	): Promise<boolean> {
		if (signal?.aborted) return false

		let entries = this.#targets.get(key)
		if (!entries) {
			entries = new Set()
			this.#targets.set(key, entries)
		}

		const earlierEntries = Array.from(entries)
		if (waitFor) {
			for (const otherKey of waitFor) {
				const otherEntries = this.#targets.get(otherKey)
				if (otherEntries) earlierEntries.push(...otherEntries)
			}
		}

		let markCommitted!: () => void
		const entry: PendingWriteEntry = {
			committed: new Promise<void>((resolve) => (markCommitted = resolve)),
		}
		entries.add(entry)

		// An aborted write will never be committed, so must not hold up any later writes
		signal?.addEventListener('abort', markCommitted, { once: true })

		try {
			return await fn({
				signal,
				commit: async (send) => {
					await Promise.all(earlierEntries.map(async (e) => e.committed))

					if (signal?.aborted) return false

					// Send synchronously after marking as committed, to ensure that any later writes are queued after this one
					markCommitted()
					return send(signal)
				},
			})
		} finally {
			signal?.removeEventListener('abort', markCommitted)
			markCommitted()

			entries.delete(entry)
			if (entries.size === 0 && this.#targets.get(key) === entries) this.#targets.delete(key)
		}
	}
}
