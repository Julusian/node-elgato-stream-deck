import type { Browser, DiscoveredService as BonjourService } from '@julusian/bonjour-service'
import { Bonjour } from '@julusian/bonjour-service'
import { EventEmitter } from 'events'
import { DEFAULT_MDNS_QUERY_INTERVAL } from './constants.js'
import { DeviceModelId, DeviceModelType, MODEL_NAMES } from '@elgato-stream-deck/core'
import { DEVICE_MODELS, VENDOR_ID } from '@elgato-stream-deck/core'

export interface StreamDeckTcpDiscoveryServiceOptions {
	/**
	 * How often to update the mDNS query, in milliseconds.
	 * Set to 0 to disable, when calling query() manually.
	 * Note: this must not be higher than the ttl reported by the streamdecks, which is currently 60s
	 */
	queryInterval?: number
}

export interface StreamDeckTcpDefinition {
	address: string
	port: number
	name: string

	vendorId: number
	productId: number

	serialNumber?: string

	modelType: DeviceModelType
	modelId: DeviceModelId
	modelName: string

	/**
	 * Whether this is a primary tcp device, or using a secondary usb port on a tcp device
	 */
	isPrimary: boolean
}

function convertService(service: BonjourService): StreamDeckTcpDefinition | null {
	if (!service.addresses || service.addresses.length === 0) return null

	const dt = Number(service.txt.dt)
	if (isNaN(dt)) return null

	if (dt === 215) {
		// This should be a Stream Deck Network Dock
		// The implementation isn't ideal, but it works well enough and avoids a breaking change to the types

		return {
			address: service.addresses[0],
			port: service.port,
			name: service.name,

			vendorId: VENDOR_ID,
			productId: 0xffff, // This doesn't have a product id, but we need to set it to something

			serialNumber: service.txt.sn,

			modelType: DeviceModelType.NETWORK_DOCK,
			modelId: DeviceModelId.NETWORK_DOCK,
			modelName: MODEL_NAMES[DeviceModelId.NETWORK_DOCK],

			isPrimary: true,
		}
	}

	// Get and parse the vendor and product id
	const vendorId = Number(service.txt.vid)
	const productId = Number(service.txt.pid)
	if (isNaN(vendorId) || isNaN(productId)) return null

	// Find the corresponding model
	const model = DEVICE_MODELS.find((model) => VENDOR_ID === vendorId && model.productIds.includes(productId))
	if (!model) return null

	return {
		address: service.addresses[0],
		port: service.port,
		name: service.name,

		vendorId,
		productId,

		serialNumber: service.txt.sn,

		modelType: model.type,
		modelId: model.id,
		modelName: model.productName,

		isPrimary: model.hasNativeTcp,
	}
}

export interface StreamDeckTcpDiscoveryServiceEvents {
	up: [service: StreamDeckTcpDefinition]
	down: [service: StreamDeckTcpDefinition]
}

export class StreamDeckTcpDiscoveryService extends EventEmitter<StreamDeckTcpDiscoveryServiceEvents> {
	readonly #server: Bonjour

	readonly #browser: Browser
	readonly #queryInterval: NodeJS.Timeout | undefined

	constructor(options?: StreamDeckTcpDiscoveryServiceOptions) {
		super()

		this.#server = new Bonjour()

		this.#browser = this.#server.find({
			type: 'elg',
			protocol: 'tcp',
		})

		this.#browser.on('up', (service) => this.#emitUp(service))
		this.#browser.on('down', (service) => this.#emitDown(service))
		this.#browser.on('srv-update', (newService, existingService) => {
			this.#emitDown(existingService)
			this.#emitUp(newService)
		})

		const queryInterval = options?.queryInterval ?? DEFAULT_MDNS_QUERY_INTERVAL
		if (queryInterval >= 0) {
			this.#queryInterval = setInterval(() => this.query(), queryInterval)
		}
	}

	get knownStreamDecks(): StreamDeckTcpDefinition[] {
		return this.#browser.services.map(convertService).filter((svc): svc is StreamDeckTcpDefinition => !!svc)
	}

	#emitDown(service: BonjourService) {
		const serviceDefinition = convertService(service)
		if (!serviceDefinition) return
		this.emit('down', serviceDefinition)
	}
	#emitUp(service: BonjourService) {
		const serviceDefinition = convertService(service)
		if (!serviceDefinition) return
		this.emit('up', serviceDefinition)
	}

	/**
	 * Broadcast the query to the network
	 */
	query(): void {
		// Tell the browser to resend the query
		this.#browser.update()

		// Tell the browser to expire any services that haven't been seen in a while
		this.#browser.expire()
	}

	destroy(): void {
		if (this.#queryInterval) clearInterval(this.#queryInterval)

		this.#server.destroy()
	}
}
