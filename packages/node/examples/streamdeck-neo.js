// @ts-check
const { listStreamDecks, openStreamDeck, DeviceModelId } = require('../dist/index')

/**
 * Draw a horizontal level meter, green then yellow then red
 * @param {number} width
 * @param {number} height
 * @param {number} level 0-1
 */
function drawMeter(width, height, level) {
	const pixels = new Uint8Array(width * height * 3)
	const litWidth = Math.round(width * level)
	for (let x = 0; x < litWidth; x++) {
		const position = x / width
		const colour = position < 0.6 ? [0, 255, 0] : position < 0.85 ? [255, 200, 0] : [255, 0, 0]
		for (let y = 0; y < height; y++) {
			pixels.set(colour, (y * width + x) * 3)
		}
	}
	return pixels
}

;(async () => {
	const devices = await listStreamDecks()
	const neoDevice = devices.find((dev) => dev.model === DeviceModelId.NEO)
	if (!neoDevice) throw new Error('No device found')

	const streamDeck = await openStreamDeck(neoDevice.path)
	await streamDeck.clearPanel()

	// The touch sensors are rgb buttons, which can also take a small low resolution image
	const sensors = streamDeck.CONTROLS.flatMap((c) =>
		c.type === 'button' && c.feedbackType === 'rgb' && c.pixelSize
			? [{ index: c.index, pixelSize: c.pixelSize }]
			: [],
	)
	if (sensors.length === 0) throw new Error('No sensors found')

	const touched = new Set()

	// Animate a meter on each sensor, at a different speed on each
	let frame = 0
	const interval = setInterval(() => {
		frame++
		for (const [i, sensor] of sensors.entries()) {
			if (touched.has(sensor.index)) continue

			const level = (Math.sin(frame / (6 + i * 3)) + 1) / 2
			const img = drawMeter(sensor.pixelSize.width, sensor.pixelSize.height, level)
			streamDeck.fillKeyBuffer(sensor.index, img).catch((e) => console.error('Fill failed:', e))
		}
	}, 50)

	streamDeck.on('down', (control) => {
		if (control.type !== 'button') return
		console.log('Button down #%d', control.index)

		// Fill a touched sensor with white, pausing its meter
		if (sensors.some((sensor) => sensor.index === control.index)) {
			touched.add(control.index)
			streamDeck.fillKeyColor(control.index, 255, 255, 255).catch((e) => console.error('Fill failed:', e))
		}
	})

	streamDeck.on('up', (control) => {
		if (control.type !== 'button') return
		console.log('Button up #%d', control.index)

		touched.delete(control.index)
	})

	streamDeck.on('error', (error) => {
		console.error(error)
		clearInterval(interval)
	})
})()
