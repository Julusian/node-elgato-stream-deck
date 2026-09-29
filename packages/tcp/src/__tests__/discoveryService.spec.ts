import { EventEmitter } from 'events'
import { DEVICE_MODELS2, DeviceModelId, DeviceModelType, MODEL_NAMES } from '@elgato-stream-deck/core'
import { Bonjour } from '@julusian/bonjour-service'
import { StreamDeckTcpDiscoveryService } from '../discoveryService.js'

jest.mock('@julusian/bonjour-service', () => ({
	Bonjour: jest.fn(),
}))

class FakeBrowser extends EventEmitter {
	services: any[] = []
	readonly update = jest.fn()
	readonly expire = jest.fn()
}

function getUsbIds(modelId: DeviceModelId): { vendorId: number; productId: number } {
	const model = DEVICE_MODELS2[modelId]
	return { vendorId: model.vendorId, productId: model.productIds[0] }
}

const STUDIO_USB = getUsbIds(DeviceModelId.STUDIO)
const XL_USB = getUsbIds(DeviceModelId.XL)

function createService(txt: Record<string, string>, overrides: Record<string, unknown> = {}): any {
	return {
		name: 'My Stream Deck',
		port: 5343,
		addresses: ['10.0.0.5', 'fe80::1'],
		txt,
		...overrides,
	}
}

describe('StreamDeckTcpDiscoveryService', () => {
	let browser: FakeBrowser
	let bonjour: { find: jest.Mock; destroy: jest.Mock }
	let service: StreamDeckTcpDiscoveryService | null

	beforeEach(() => {
		browser = new FakeBrowser()
		bonjour = { find: jest.fn(() => browser), destroy: jest.fn() }
		jest.mocked(Bonjour).mockImplementation(() => bonjour as any)
		service = null
	})

	afterEach(() => {
		service?.destroy()
		jest.useRealTimers()
	})

	function createDiscovery(queryInterval = 0): StreamDeckTcpDiscoveryService {
		service = new StreamDeckTcpDiscoveryService({ queryInterval })
		return service
	}

	test('browses for elgato tcp services', () => {
		createDiscovery()

		expect(bonjour.find).toHaveBeenCalledWith({ type: 'elg', protocol: 'tcp' })
	})

	describe('service conversion', () => {
		function convert(svc: any): unknown {
			const discovery = createDiscovery()
			const onUp = jest.fn()
			discovery.on('up', onUp)
			browser.emit('up', svc)
			return onUp.mock.calls[0]?.[0] ?? null
		}

		test('converts a primary tcp device', () => {
			expect(
				convert(
					createService({
						vid: String(STUDIO_USB.vendorId),
						pid: String(STUDIO_USB.productId),
						sn: 'STUDIO1',
						dt: '1',
					}),
				),
			).toEqual({
				address: '10.0.0.5',
				port: 5343,
				name: 'My Stream Deck',
				vendorId: STUDIO_USB.vendorId,
				productId: STUDIO_USB.productId,
				serialNumber: 'STUDIO1',
				modelType: DEVICE_MODELS2[DeviceModelId.STUDIO].type,
				modelId: DeviceModelId.STUDIO,
				modelName: MODEL_NAMES[DeviceModelId.STUDIO],
				isPrimary: true,
			})
		})

		test('converts a usb device attached to a tcp device as secondary', () => {
			expect(
				convert(
					createService(
						{ vid: String(XL_USB.vendorId), pid: String(XL_USB.productId), sn: 'XL1', dt: '1' },
						{ port: 5344 },
					),
				),
			).toMatchObject({
				port: 5344,
				modelId: DeviceModelId.XL,
				serialNumber: 'XL1',
				isPrimary: false,
			})
		})

		test('converts a network dock', () => {
			expect(convert(createService({ dt: '215', sn: 'DOCK1' }))).toEqual({
				address: '10.0.0.5',
				port: 5343,
				name: 'My Stream Deck',
				vendorId: 0x0fd9,
				productId: 0xffff,
				serialNumber: 'DOCK1',
				modelType: DeviceModelType.NETWORK_DOCK,
				modelId: DeviceModelId.NETWORK_DOCK,
				modelName: MODEL_NAMES[DeviceModelId.NETWORK_DOCK],
				isPrimary: true,
			})
		})

		test('parses hex ids', () => {
			expect(
				convert(createService({ vid: '0x0fd9', pid: `0x${STUDIO_USB.productId.toString(16)}`, dt: '1' })),
			).toMatchObject({ modelId: DeviceModelId.STUDIO })
		})

		test('leaves the serial number undefined when missing', () => {
			expect(
				convert(
					createService({ vid: String(STUDIO_USB.vendorId), pid: String(STUDIO_USB.productId), dt: '1' }),
				),
			).toMatchObject({ serialNumber: undefined })
		})

		test.each([
			['no addresses', createService({ dt: '215' }, { addresses: [] })],
			['undefined addresses', createService({ dt: '215' }, { addresses: undefined })],
			['a missing dt', createService({ vid: '4057', pid: String(STUDIO_USB.productId) })],
			['a non-numeric dt', createService({ dt: 'abc', vid: '4057', pid: String(STUDIO_USB.productId) })],
			['a missing vid', createService({ dt: '1', pid: String(STUDIO_USB.productId) })],
			['a missing pid', createService({ dt: '1', vid: '4057' })],
			['an unknown product', createService({ dt: '1', vid: '4057', pid: '4660' })],
		])('ignores a service with %s', (_name, svc) => {
			expect(convert(svc)).toBeNull()
		})
	})

	describe('events', () => {
		const studio = createService({ vid: String(STUDIO_USB.vendorId), pid: String(STUDIO_USB.productId), dt: '1' })

		test('emits down', () => {
			const discovery = createDiscovery()
			const onDown = jest.fn()
			discovery.on('down', onDown)

			browser.emit('down', studio)

			expect(onDown).toHaveBeenCalledWith(expect.objectContaining({ modelId: DeviceModelId.STUDIO }))
		})

		test('emits down then up for a service update', () => {
			const discovery = createDiscovery()
			const events: Array<[string, unknown]> = []
			discovery.on('up', (svc) => events.push(['up', svc.port]))
			discovery.on('down', (svc) => events.push(['down', svc.port]))

			browser.emit('srv-update', { ...studio, port: 5350 }, studio)

			expect(events).toEqual([
				['down', 5343],
				['up', 5350],
			])
		})

		test('does not emit for unrecognised services', () => {
			const discovery = createDiscovery()
			const onUp = jest.fn()
			const onDown = jest.fn()
			discovery.on('up', onUp)
			discovery.on('down', onDown)

			const unknown = createService({ dt: '1', vid: '1', pid: '1' })
			browser.emit('up', unknown)
			browser.emit('down', unknown)

			expect(onUp).not.toHaveBeenCalled()
			expect(onDown).not.toHaveBeenCalled()
		})
	})

	test('knownStreamDecks lists the recognised services', () => {
		const discovery = createDiscovery()
		browser.services = [
			createService({ vid: String(STUDIO_USB.vendorId), pid: String(STUDIO_USB.productId), dt: '1' }),
			createService({ dt: '1', vid: '1', pid: '1' }),
			createService({ dt: '215' }, { port: 5400 }),
		]

		expect(discovery.knownStreamDecks.map((svc) => [svc.modelId, svc.port])).toEqual([
			[DeviceModelId.STUDIO, 5343],
			[DeviceModelId.NETWORK_DOCK, 5400],
		])
	})

	describe('querying', () => {
		test('query resends the query and expires stale services', () => {
			const discovery = createDiscovery()

			discovery.query()

			expect(browser.update).toHaveBeenCalledTimes(1)
			expect(browser.expire).toHaveBeenCalledTimes(1)
		})

		test('queries on the default interval', async () => {
			jest.useFakeTimers()
			service = new StreamDeckTcpDiscoveryService()

			await jest.advanceTimersByTimeAsync(30000)

			expect(browser.update).toHaveBeenCalledTimes(3)
		})

		test('queries on a custom interval', async () => {
			jest.useFakeTimers()
			createDiscovery(1000)

			await jest.advanceTimersByTimeAsync(3500)

			expect(browser.update).toHaveBeenCalledTimes(3)
		})

		test('does not query automatically when the interval is 0', async () => {
			jest.useFakeTimers()
			createDiscovery(0)

			await jest.advanceTimersByTimeAsync(1000)

			expect(browser.update).not.toHaveBeenCalled()
			expect(jest.getTimerCount()).toBe(0)
		})

		test('destroy stops querying and destroys bonjour', async () => {
			jest.useFakeTimers()
			const discovery = createDiscovery(1000)

			discovery.destroy()
			service = null
			await jest.advanceTimersByTimeAsync(3000)

			expect(browser.update).not.toHaveBeenCalled()
			expect(bonjour.destroy).toHaveBeenCalledTimes(1)
		})
	})
})
