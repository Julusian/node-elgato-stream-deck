import { readFixtureJSON } from './helpers.js'
import type { StreamDeck } from '../index.js'
import { DeviceModelId, DEVICE_MODELS } from '../index.js'
import type { OpenStreamDeckOptions, EncodeJPEGHelper } from '../models/base.js'
import { DummyHID } from './hid.js'

async function openStreamDeck(
	path: string,
	deviceModel: DeviceModelId,
	userOptions?: OpenStreamDeckOptions,
): Promise<StreamDeck> {
	const encodeJpegMock: jest.MockedFunction<EncodeJPEGHelper> = jest.fn((_b: Uint8Array, _w: number, _h: number) => {
		throw new Error('Not implemented')
	})
	const options: Required<OpenStreamDeckOptions> = {
		encodeJPEG: encodeJpegMock,
		...userOptions,
	}

	const model = DEVICE_MODELS.find((m) => m.id === deviceModel)
	if (!model) {
		throw new Error('Stream Deck is of unexpected type.')
	}

	const device = new DummyHID(path, encodeJpegMock)
	return model.factory(
		device,
		options || {
			encodeJPEG: undefined,
		},
	)
}

describe('StreamDeck', () => {
	const devicePath = 'some_random_path_here'
	let streamDeck: StreamDeck
	function getDevice(sd?: StreamDeck): DummyHID {
		return (sd || (streamDeck as any)).device
	}

	beforeEach(async () => {
		streamDeck = await openStreamDeck(devicePath, DeviceModelId.ORIGINAL)
	})

	test('down and up events', () => {
		const downSpy = jest.fn()
		const upSpy = jest.fn()
		streamDeck.on('down', downSpy)
		streamDeck.on('up', upSpy)

		const device = getDevice()
		// prettier-ignore
		device.emit('input', new Uint8Array([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))
		// prettier-ignore
		device.emit('input', new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))

		// prettier-ignore
		device.emit('input', new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))
		// prettier-ignore
		device.emit('input', new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))

		expect(downSpy).toHaveBeenCalledTimes(2)
		expect(upSpy).toHaveBeenCalledTimes(2)
		expect(downSpy).toHaveBeenNthCalledWith(1, {
			column: 4,
			feedbackType: 'lcd',
			hidIndex: 0,
			index: 4,
			row: 0,
			type: 'button',
			pixelSize: {
				width: 72,
				height: 72,
			},
		})
		expect(upSpy).toHaveBeenNthCalledWith(1, {
			column: 4,
			feedbackType: 'lcd',
			hidIndex: 0,
			index: 4,
			row: 0,
			type: 'button',
			pixelSize: {
				width: 72,
				height: 72,
			},
		})
		expect(downSpy).toHaveBeenNthCalledWith(2, {
			column: 3,
			feedbackType: 'lcd',
			hidIndex: 6,
			index: 8,
			row: 1,
			type: 'button',
			pixelSize: {
				width: 72,
				height: 72,
			},
		})
		expect(upSpy).toHaveBeenNthCalledWith(2, {
			column: 3,
			feedbackType: 'lcd',
			hidIndex: 6,
			index: 8,
			row: 1,
			type: 'button',
			pixelSize: {
				width: 72,
				height: 72,
			},
		})
	})
})

describe('StreamDeck Mini', () => {
	const devicePath = 'some_path_for_mini'
	let streamDeck: StreamDeck
	function getDevice(sd?: StreamDeck): DummyHID {
		return (sd || (streamDeck as any)).device
	}

	beforeEach(async () => {
		streamDeck = await openStreamDeck(devicePath, DeviceModelId.MINI)
	})

	test('constructor uses the provided devicePath', async () => {
		const streamDeck2 = await openStreamDeck(devicePath, DeviceModelId.MINI)
		const device = getDevice(streamDeck2)
		expect(device.path).toEqual(devicePath)
		expect(streamDeck2.MODEL).toEqual(DeviceModelId.MINI)
	})

	test('fillImage', async () => {
		const device = getDevice()
		const writeFn: jest.Mock<Promise<void>, [Buffer[]]> = (device.sendReports = jest.fn())
		expect(writeFn).toHaveBeenCalledTimes(0)
		await streamDeck.fillKeyBuffer(0, readFixtureJSON('fillImage-sample-icon-80.json'))

		expect(writeFn.mock.calls).toMatchSnapshot()
	})

	test('down and up events', () => {
		const downSpy = jest.fn()
		const upSpy = jest.fn()
		streamDeck.on('down', downSpy)
		streamDeck.on('up', upSpy)

		const device = getDevice()
		// prettier-ignore
		device.emit('input', new Uint8Array([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))
		// prettier-ignore
		device.emit('input', new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))

		expect(downSpy).toHaveBeenCalledTimes(1)
		expect(upSpy).toHaveBeenCalledTimes(1)
		expect(downSpy).toHaveBeenNthCalledWith(1, {
			column: 0,
			feedbackType: 'lcd',
			hidIndex: 0,
			index: 0,
			row: 0,
			type: 'button',
			pixelSize: {
				width: 80,
				height: 80,
			},
		})
		expect(upSpy).toHaveBeenNthCalledWith(1, {
			column: 0,
			feedbackType: 'lcd',
			hidIndex: 0,
			index: 0,
			row: 0,
			type: 'button',
			pixelSize: {
				width: 80,
				height: 80,
			},
		})
	})
})

describe('StreamDeck XL', () => {
	const devicePath = 'some_path_for_xl'
	let streamDeck: StreamDeck
	function getDevice(sd?: StreamDeck): DummyHID {
		return (sd || (streamDeck as any)).device
	}

	beforeEach(async () => {
		streamDeck = await openStreamDeck(devicePath, DeviceModelId.XL)
	})

	test('constructor uses the provided devicePath', async () => {
		const streamDeck2 = await openStreamDeck(devicePath, DeviceModelId.XL)
		const device = getDevice(streamDeck2)
		expect(device.path).toEqual(devicePath)
		expect(streamDeck2.MODEL).toEqual(DeviceModelId.XL)
	})

	test('down and up events', () => {
		const downSpy = jest.fn()
		const upSpy = jest.fn()
		streamDeck.on('down', downSpy)
		streamDeck.on('up', upSpy)

		const device = getDevice()
		// prettier-ignore
		device.emit('input', new Uint8Array([0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))
		// prettier-ignore
		device.emit('input', new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))

		expect(downSpy).toHaveBeenCalledTimes(1)
		expect(upSpy).toHaveBeenCalledTimes(1)
		expect(downSpy).toHaveBeenNthCalledWith(1, {
			column: 0,
			feedbackType: 'lcd',
			hidIndex: 0,
			index: 0,
			row: 0,
			type: 'button',
			pixelSize: {
				width: 96,
				height: 96,
			},
		})
		expect(upSpy).toHaveBeenNthCalledWith(1, {
			column: 0,
			feedbackType: 'lcd',
			hidIndex: 0,
			index: 0,
			row: 0,
			type: 'button',
			pixelSize: {
				width: 96,
				height: 96,
			},
		})
	})
})

describe('StreamDeck Original V2', () => {
	const devicePath = 'some_path_for_v2'
	let streamDeck: StreamDeck
	function getDevice(sd?: StreamDeck): DummyHID {
		return (sd || (streamDeck as any)).device
	}

	beforeEach(async () => {
		streamDeck = await openStreamDeck(devicePath, DeviceModelId.ORIGINALV2)
	})

	test('constructor uses the provided devicePath', async () => {
		const streamDeck2 = await openStreamDeck(devicePath, DeviceModelId.ORIGINALV2)
		const device = getDevice(streamDeck2)
		expect(device.path).toEqual(devicePath)
		expect(streamDeck2.MODEL).toEqual(DeviceModelId.ORIGINALV2)
	})

	test('down and up events', () => {
		const downSpy = jest.fn()
		const upSpy = jest.fn()
		streamDeck.on('down', downSpy)
		streamDeck.on('up', upSpy)

		const device = getDevice()
		// prettier-ignore
		device.emit('input', new Uint8Array([0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))
		// prettier-ignore
		device.emit('input', new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))

		expect(downSpy).toHaveBeenCalledTimes(1)
		expect(upSpy).toHaveBeenCalledTimes(1)
		expect(downSpy).toHaveBeenNthCalledWith(1, {
			column: 0,
			feedbackType: 'lcd',
			hidIndex: 0,
			index: 0,
			row: 0,
			type: 'button',
			pixelSize: {
				width: 72,
				height: 72,
			},
		})
		expect(upSpy).toHaveBeenNthCalledWith(1, {
			column: 0,
			feedbackType: 'lcd',
			hidIndex: 0,
			index: 0,
			row: 0,
			type: 'button',
			pixelSize: {
				width: 72,
				height: 72,
			},
		})
	})
})
