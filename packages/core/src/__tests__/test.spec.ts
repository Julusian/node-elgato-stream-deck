/* eslint-disable @typescript-eslint/unbound-method */

import { readFixtureJSON } from './helpers.js'
import type { StreamDeck } from '../index.js'
import { DeviceModelId, DEVICE_MODELS } from '../index.js'
import type { OpenStreamDeckOptions, EncodeJPEGHelper } from '../models/base.js'
import { DummyHID } from './hid.js'

function openStreamDeck(path: string, deviceModel: DeviceModelId, userOptions?: OpenStreamDeckOptions): StreamDeck {
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

function runForDevice(path: string, model: DeviceModelId, supportsRgbKeyFill: boolean): void {
	let streamDeck: StreamDeck
	function getDevice(sd?: StreamDeck): DummyHID {
		return (sd || (streamDeck as any)).device
	}

	beforeEach(() => {
		streamDeck = openStreamDeck(path, model)
	})

	test('checkValidKeyIndex', async () => {
		await expect(async () => streamDeck.clearKey(-1)).rejects.toThrow()
		await expect(async () => streamDeck.clearKey(15)).rejects.toThrow()
	})

	if (supportsRgbKeyFill) {
		test('clearKey-rgb', async () => {
			const hid = getDevice(streamDeck)
			const mockedFn = (hid.sendFeatureReport = jest.fn(async () => Promise.resolve()))
			await streamDeck.clearKey(2)
			expect(mockedFn).toHaveBeenCalledTimes(1)
			expect(mockedFn).toHaveBeenNthCalledWith(1, new Uint8Array([3, 6, 2, 0, 0, 0]))
		})

		test.skip('clearPanel-rgb', async () => {
			const hid = getDevice(streamDeck)
			const mockedFn = (hid.sendFeatureReport = jest.fn(async () => Promise.resolve()))
			await streamDeck.clearPanel()

			const keyCount = streamDeck.NUM_KEYS
			expect(mockedFn).toHaveBeenCalledTimes(keyCount)
			for (let i = 0; i < keyCount; i++) {
				expect(mockedFn).toHaveBeenNthCalledWith(i + 1, Buffer.from([3, 6, i, 0, 0, 0]))
			}
		})
	} else {
		test.skip('clearKey', async () => {
			const mockedFn = ((streamDeck as any).fillImageRange = jest.fn(async () => Promise.resolve()))
			await streamDeck.clearKey(2)
			expect(mockedFn).toHaveBeenCalledTimes(1)
			expect(mockedFn).toHaveBeenNthCalledWith(1, 2, expect.anything(), expect.anything())
		})

		test.skip('clearPanel', async () => {
			const mockedFn = ((streamDeck as any).fillImageRange = jest.fn(async () => Promise.resolve()))
			await streamDeck.clearPanel()

			const keyCount = streamDeck.NUM_KEYS
			expect(mockedFn).toHaveBeenCalledTimes(keyCount)
			for (let i = 0; i < keyCount; i++) {
				expect(mockedFn).toHaveBeenNthCalledWith(i + 1, i, expect.anything(), expect.anything())
			}
		})
	}

	test('fillKeyBuffer throws on undersized buffers', async () => {
		const smallBuffer = Buffer.alloc(1)

		await expect(async () => streamDeck.fillKeyBuffer(0, smallBuffer)).rejects.toThrow('Expected image buffer')
	})

	test('forwards error events from the device', () => {
		const errorSpy = jest.fn()
		streamDeck.on('error', errorSpy)

		const device = getDevice()
		device.emit('error', new Error('Test'))

		expect(errorSpy).toHaveBeenCalledTimes(1)
		expect(errorSpy).toHaveBeenNthCalledWith(1, new Error('Test'))
	})

	if (model !== DeviceModelId.XL && model !== DeviceModelId.ORIGINALV2 && model !== DeviceModelId.ORIGINALMK2) {
		test('setBrightness', async () => {
			const device = getDevice()
			device.sendFeatureReport = jest.fn()

			await streamDeck.setBrightness(100)
			await streamDeck.setBrightness(0)

			expect(device.sendFeatureReport).toHaveBeenCalledTimes(2)
			// prettier-ignore
			expect(device.sendFeatureReport).toHaveBeenNthCalledWith(1, new Uint8Array([0x05, 0x55, 0xaa, 0xd1, 0x01, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))
			// prettier-ignore
			expect(device.sendFeatureReport).toHaveBeenNthCalledWith(2, new Uint8Array([0x05, 0x55, 0xaa, 0xd1, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))

			await expect(async () => streamDeck.setBrightness(101)).rejects.toThrow()
			await expect(async () => streamDeck.setBrightness(-1)).rejects.toThrow()
		})

		test('resetToLogo', async () => {
			const device = getDevice()
			device.sendFeatureReport = jest.fn()

			await streamDeck.resetToLogo()

			expect(device.sendFeatureReport).toHaveBeenCalledTimes(1)
			// prettier-ignore
			expect(device.sendFeatureReport).toHaveBeenNthCalledWith(1, new Uint8Array([0x0B, 0x63, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))
		})

		test('firmwareVersion', async () => {
			const device = getDevice()
			device.getFeatureReport = async (): Promise<Uint8Array> => {
				return new Uint8Array([4, 85, 170, 212, 4, 49, 46, 48, 46, 49, 55, 48, 49, 51, 51, 0, 0])
			}

			const firmware = await streamDeck.getFirmwareVersion()
			expect(firmware).toEqual('1.0.170133')
		})

		test('serialNumber', async () => {
			const device = getDevice()
			device.getFeatureReport = async (): Promise<Uint8Array> => {
				return new Uint8Array([3, 85, 170, 211, 3, 65, 76, 51, 55, 71, 49, 65, 48, 50, 56, 52, 48])
			}

			const firmware = await streamDeck.getSerialNumber()
			expect(firmware).toEqual('AL37G1A02840')
		})
	} else {
		test('setBrightness-jpeg', async () => {
			const device = getDevice()
			device.sendFeatureReport = jest.fn()

			await streamDeck.setBrightness(100)
			await streamDeck.setBrightness(0)

			expect(device.sendFeatureReport).toHaveBeenCalledTimes(2)
			const expected = new Uint8Array(32)
			expected[0] = 0x03
			expected[1] = 0x08
			expected[2] = 0x64 // 100%
			// prettier-ignore
			expect(device.sendFeatureReport).toHaveBeenNthCalledWith(1, expected)
			expected[2] = 0x00 // 100%
			expect(device.sendFeatureReport).toHaveBeenNthCalledWith(2, expected)

			await expect(async () => streamDeck.setBrightness(101)).rejects.toThrow()
			await expect(async () => streamDeck.setBrightness(-1)).rejects.toThrow()
		})

		test('resetToLogo-jpeg', async () => {
			const device = getDevice()
			device.sendFeatureReport = jest.fn()

			await streamDeck.resetToLogo()

			expect(device.sendFeatureReport).toHaveBeenCalledTimes(1)
			// prettier-ignore
			expect(device.sendFeatureReport).toHaveBeenNthCalledWith(1, new Uint8Array([0x03, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))
		})

		test('firmwareVersion-jpeg', async () => {
			const device = getDevice()
			device.getFeatureReport = async (): Promise<Uint8Array> => {
				// prettier-ignore
				return new Uint8Array([ 5, 12, 254, 90, 239, 250, 49, 46, 48, 48, 46, 48, 48, 52, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ])
			}

			const firmware = await streamDeck.getFirmwareVersion()
			expect(firmware).toEqual('1.00.004')
		})

		test('serialNumber-jpeg', async () => {
			const device = getDevice()
			device.getFeatureReport = async (): Promise<Uint8Array> => {
				// prettier-ignore
				return new Uint8Array([ 6, 12, 67, 76, 49, 56, 73, 49, 65, 48, 48, 57, 49, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ])
			}

			const firmware = await streamDeck.getSerialNumber()
			expect(firmware).toEqual('CL18I1A00913')
		})
	}

	test('close', async () => {
		const device = getDevice()
		device.close = jest.fn()

		await streamDeck.close()

		expect(device.close).toHaveBeenCalledTimes(1)
	})

	test.skip('fillPanelBuffer', async () => {
		const buttonControls = streamDeck.CONTROLS.filter((c) => c.type === 'button' && c.feedbackType === 'lcd')
		const buffer = Buffer.alloc(buttonControls.length * streamDeck.BUTTON_TOTAL_PX * 3)

		const fillKeyBufferMock = ((streamDeck as any).fillImageRange = jest.fn())
		await streamDeck.fillPanelBuffer(buffer)

		expect(fillKeyBufferMock).toHaveBeenCalledTimes(buttonControls.length)
		const columnCount = buttonControls.reduce((acc, c) => Math.max(acc, c.column), 0) + 1

		const stride = columnCount * streamDeck.BUTTON_WIDTH_PX * 3
		for (let i = 0; i < buttonControls.length; i++) {
			expect(fillKeyBufferMock).toHaveBeenCalledWith(i, expect.any(Buffer), {
				format: 'rgb',
				offset: expect.any(Number),
				stride,
			})
			// Buffer has to be seperately as a deep equality check is really slow
			expect(fillKeyBufferMock.mock.calls[i][1]).toBe(buffer)
		}
	})

	test.skip('fillPanelBuffer with format', async () => {
		const buffer = Buffer.alloc(streamDeck.NUM_KEYS * streamDeck.BUTTON_TOTAL_PX * 4)

		const fillKeyBufferMock = ((streamDeck as any).fillImageRange = jest.fn())
		await streamDeck.fillPanelBuffer(buffer, { format: 'bgra' })

		expect(fillKeyBufferMock).toHaveBeenCalledTimes(streamDeck.NUM_KEYS)

		const stride = streamDeck.KEY_COLUMNS * streamDeck.BUTTON_WIDTH_PX * 4
		for (let i = 0; i < streamDeck.NUM_KEYS; i++) {
			expect(fillKeyBufferMock).toHaveBeenCalledWith(i, expect.any(Buffer), {
				format: 'bgra',
				offset: expect.any(Number),
				stride,
			})
			// Buffer has to be seperately as a deep equality check is really slow
			expect(fillKeyBufferMock.mock.calls[i][1]).toBe(buffer)
		}
	})

	test.skip('fillPanelBuffer bad format', async () => {
		const buffer = Buffer.alloc(streamDeck.NUM_KEYS * streamDeck.BUTTON_TOTAL_PX * 3)

		const fillKeyBufferMock = ((streamDeck as any).fillImageRange = jest.fn())
		await expect(async () => streamDeck.fillPanelBuffer(buffer, { format: 'abc' as any })).rejects.toThrow()

		expect(fillKeyBufferMock).toHaveBeenCalledTimes(0)
	})

	test('fillPanelBuffer bad buffer', async () => {
		const buffer = Buffer.alloc(100)
		const fillKeyBufferMock = ((streamDeck as any).fillImageRange = jest.fn())
		await expect(async () => streamDeck.fillPanelBuffer(buffer)).rejects.toThrow()

		expect(fillKeyBufferMock).toHaveBeenCalledTimes(0)
	})

	test.skip('fillKeyBuffer', async () => {
		const buffer = Buffer.alloc(streamDeck.BUTTON_TOTAL_PX * 3)

		const fillKeyBufferMock = ((streamDeck as any).fillImageRange = jest.fn())
		await streamDeck.fillKeyBuffer(2, buffer)

		expect(fillKeyBufferMock).toHaveBeenCalledTimes(1)
		expect(fillKeyBufferMock).toHaveBeenCalledWith(2, expect.any(Buffer), {
			format: 'rgb',
			offset: 0,
			stride: streamDeck.BUTTON_WIDTH_PX * 3,
		})
		// Buffer has to be seperately as a deep equality check is really slow
		expect(fillKeyBufferMock.mock.calls[0][1]).toBe(buffer)
	})

	test.skip('fillKeyBuffer with format', async () => {
		const buffer = Buffer.alloc(streamDeck.BUTTON_TOTAL_PX * 4)

		const fillKeyBufferMock = ((streamDeck as any).fillImageRange = jest.fn())
		await streamDeck.fillKeyBuffer(2, buffer, { format: 'rgba' })

		expect(fillKeyBufferMock).toHaveBeenCalledTimes(1)
		expect(fillKeyBufferMock).toHaveBeenCalledWith(2, expect.any(Buffer), {
			format: 'rgba',
			offset: 0,
			stride: streamDeck.BUTTON_WIDTH_PX * 4,
		})
		// Buffer has to be seperately as a deep equality check is really slow
		expect(fillKeyBufferMock.mock.calls[0][1]).toBe(buffer)
	})

	test.skip('fillKeyBuffer bad key', async () => {
		const buffer = Buffer.alloc(streamDeck.BUTTON_TOTAL_PX * 3)

		const fillKeyBufferMock = ((streamDeck as any).fillImageRange = jest.fn())
		await expect(async () => streamDeck.fillKeyBuffer(-1, buffer)).rejects.toThrow()
		await expect(async () => streamDeck.fillKeyBuffer(streamDeck.NUM_KEYS + 1, buffer)).rejects.toThrow()

		expect(fillKeyBufferMock).toHaveBeenCalledTimes(0)
	})

	test.skip('fillKeyBuffer bad format', async () => {
		const buffer = Buffer.alloc(streamDeck.BUTTON_TOTAL_PX * 3)

		const fillKeyBufferMock = ((streamDeck as any).fillImageRange = jest.fn())
		await expect(async () => streamDeck.fillKeyBuffer(1, buffer, { format: 'abc' as any })).rejects.toThrow()

		expect(fillKeyBufferMock).toHaveBeenCalledTimes(0)
	})

	test('fillKeyBuffer bad buffer', async () => {
		const buffer = Buffer.alloc(100)

		const fillKeyBufferMock = ((streamDeck as any).fillImageRange = jest.fn())
		await expect(async () => streamDeck.fillKeyBuffer(2, buffer)).rejects.toThrow()

		expect(fillKeyBufferMock).toHaveBeenCalledTimes(0)
	})

	if (supportsRgbKeyFill) {
		test('fillKeyColor-rgb', async () => {
			const hid = getDevice(streamDeck)
			const mockedFn = (hid.sendFeatureReport = jest.fn(async () => Promise.resolve()))

			await streamDeck.fillKeyColor(4, 123, 255, 86)

			expect(mockedFn).toHaveBeenCalledTimes(1)
			expect(mockedFn).toHaveBeenNthCalledWith(1, new Uint8Array([3, 6, 4, 123, 255, 86]))
		})
	} else {
		test.skip('fillKeyColor', async () => {
			const fillKeyBufferMock = ((streamDeck as any).fillImageRange = jest.fn())
			await streamDeck.fillKeyColor(4, 123, 255, 86)

			expect(fillKeyBufferMock).toHaveBeenCalledTimes(1)
			expect(fillKeyBufferMock).toHaveBeenCalledWith(4, expect.any(Buffer), {
				format: 'rgb',
				offset: 0,
				stride: streamDeck.BUTTON_WIDTH_PX * 3,
			})
			// console.log(JSON.stringify(bufferToIntArray(fillKeyBufferMock.mock.calls[0][1])))
			expect(fillKeyBufferMock.mock.calls[0][1]).toEqual(
				readFixtureJSON(`fillColor-buffer-${streamDeck.BUTTON_WIDTH_PX}.json`),
			)
		})
	}

	test('fillKeyColor bad rgb', async () => {
		await expect(async () => streamDeck.fillKeyColor(0, 256, 0, 0)).rejects.toThrow()
		await expect(async () => streamDeck.fillKeyColor(0, 0, 256, 0)).rejects.toThrow()
		await expect(async () => streamDeck.fillKeyColor(0, 0, 0, 256)).rejects.toThrow()
		await expect(async () => streamDeck.fillKeyColor(0, -1, 0, 0)).rejects.toThrow()
	})

	test('fillKeyColor bad key', async () => {
		await expect(async () => streamDeck.fillKeyColor(-1, 0, 0, 0)).rejects.toThrow()
		await expect(async () => streamDeck.fillKeyColor(50, 0, 256, 0)).rejects.toThrow()
	})
}

describe('StreamDeck', () => {
	const devicePath = 'some_random_path_here'
	let streamDeck: StreamDeck
	function getDevice(sd?: StreamDeck): DummyHID {
		return (sd || (streamDeck as any)).device
	}

	beforeEach(() => {
		streamDeck = openStreamDeck(devicePath, DeviceModelId.ORIGINAL)
	})

	test.skip('fillKeyColor', async () => {
		const fillKeyBufferMock = ((streamDeck as any).fillImageRange = jest.fn())
		await streamDeck.fillKeyColor(0, 1, 2, 3)
		await streamDeck.fillKeyColor(4, 1, 2, 3)
		await streamDeck.fillKeyColor(7, 1, 2, 3)
		await streamDeck.fillKeyColor(14, 1, 2, 3)

		expect(fillKeyBufferMock).toHaveBeenCalledTimes(4)
		expect(fillKeyBufferMock).toHaveBeenNthCalledWith(1, 0, expect.any(Buffer), {
			format: 'rgb',
			offset: 0,
			stride: streamDeck.BUTTON_WIDTH_PX * 3,
		})
		expect(fillKeyBufferMock).toHaveBeenNthCalledWith(2, 4, expect.any(Buffer), {
			format: 'rgb',
			offset: 0,
			stride: streamDeck.BUTTON_WIDTH_PX * 3,
		})
		expect(fillKeyBufferMock).toHaveBeenNthCalledWith(3, 7, expect.any(Buffer), {
			format: 'rgb',
			offset: 0,
			stride: streamDeck.BUTTON_WIDTH_PX * 3,
		})
		expect(fillKeyBufferMock).toHaveBeenNthCalledWith(4, 14, expect.any(Buffer), {
			format: 'rgb',
			offset: 0,
			stride: streamDeck.BUTTON_WIDTH_PX * 3,
		})
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

	beforeEach(() => {
		streamDeck = openStreamDeck(devicePath, DeviceModelId.MINI)
	})

	test('constructor uses the provided devicePath', () => {
		const streamDeck2 = openStreamDeck(devicePath, DeviceModelId.MINI)
		const device = getDevice(streamDeck2)
		expect(device.path).toEqual(devicePath)
		expect(streamDeck2.MODEL).toEqual(DeviceModelId.MINI)
	})

	runForDevice(devicePath, DeviceModelId.MINI, false)

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

	beforeEach(() => {
		streamDeck = openStreamDeck(devicePath, DeviceModelId.XL)
	})

	test('constructor uses the provided devicePath', () => {
		const streamDeck2 = openStreamDeck(devicePath, DeviceModelId.XL)
		const device = getDevice(streamDeck2)
		expect(device.path).toEqual(devicePath)
		expect(streamDeck2.MODEL).toEqual(DeviceModelId.XL)
	})

	runForDevice(devicePath, DeviceModelId.XL, true)

	test('setBrightness', async () => {
		const device = getDevice()
		device.sendFeatureReport = jest.fn()

		await streamDeck.setBrightness(100)
		await streamDeck.setBrightness(0)

		expect(device.sendFeatureReport).toHaveBeenCalledTimes(2)
		const expected = new Uint8Array(32)
		expected[0] = 0x03
		expected[1] = 0x08
		expected[2] = 0x64 // 100%
		// prettier-ignore
		expect(device.sendFeatureReport).toHaveBeenNthCalledWith(1, expected)
		expected[2] = 0x00 // 100%
		expect(device.sendFeatureReport).toHaveBeenNthCalledWith(2, expected)

		await expect(async () => streamDeck.setBrightness(101)).rejects.toThrow()
		await expect(async () => streamDeck.setBrightness(-1)).rejects.toThrow()
	})

	test('resetToLogo', async () => {
		const device = getDevice()
		device.sendFeatureReport = jest.fn()

		await streamDeck.resetToLogo()

		expect(device.sendFeatureReport).toHaveBeenCalledTimes(1)
		// prettier-ignore
		expect(device.sendFeatureReport).toHaveBeenNthCalledWith(1, new Uint8Array([0x03, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))
	})

	test('firmwareVersion', async () => {
		const device = getDevice()
		device.getFeatureReport = async (): Promise<Uint8Array> => {
			// prettier-ignore
			return new Uint8Array([ 5, 12, 254, 90, 239, 250, 49, 46, 48, 48, 46, 48, 48, 52, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ])
		}

		const firmware = await streamDeck.getFirmwareVersion()
		expect(firmware).toEqual('1.00.004')
	})

	test('serialNumber', async () => {
		const device = getDevice()
		device.getFeatureReport = async (): Promise<Uint8Array> => {
			// prettier-ignore
			return new Uint8Array([ 6, 12, 67, 76, 49, 56, 73, 49, 65, 48, 48, 57, 49, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ])
		}

		const firmware = await streamDeck.getSerialNumber()
		expect(firmware).toEqual('CL18I1A00913')
	})

	test.skip('fillImage', async () => {
		const device = getDevice()
		device.encodeJPEG.mockImplementationOnce(async (buffer: Uint8Array) => {
			const start = buffer.length / 8
			return buffer.subarray(start, start * 2)
		})

		const writeFn: jest.Mock<Promise<void>, [Buffer[]]> = (device.sendReports = jest.fn())
		expect(writeFn).toHaveBeenCalledTimes(0)
		await streamDeck.fillKeyBuffer(0, readFixtureJSON('fillImage-sample-icon-96.json'))

		expect(writeFn.mock.calls).toMatchSnapshot()
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

	beforeEach(() => {
		streamDeck = openStreamDeck(devicePath, DeviceModelId.ORIGINALV2)
	})

	test('constructor uses the provided devicePath', () => {
		const streamDeck2 = openStreamDeck(devicePath, DeviceModelId.ORIGINALV2)
		const device = getDevice(streamDeck2)
		expect(device.path).toEqual(devicePath)
		expect(streamDeck2.MODEL).toEqual(DeviceModelId.ORIGINALV2)
	})

	runForDevice(devicePath, DeviceModelId.ORIGINALV2, true)

	test.skip('fillImage', async () => {
		const device = getDevice()
		device.encodeJPEG.mockImplementationOnce(async (buffer: Uint8Array) => {
			const start = buffer.length / 8
			return buffer.subarray(start, start * 2)
		})

		const writeFn: jest.Mock<Promise<void>, [Buffer[]]> = (device.sendReports = jest.fn())
		expect(writeFn).toHaveBeenCalledTimes(0)
		await streamDeck.fillKeyBuffer(0, readFixtureJSON('fillImage-sample-icon-72.json'))

		expect(writeFn.mock.calls).toMatchSnapshot()
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
