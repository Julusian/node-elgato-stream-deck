const { usb } = require('usb')
const { listStreamDecks, openStreamDeck, VENDOR_ID, CORSAIR_VENDOR_ID } = require('../dist/index')
const streamDecks = {}

async function addDevice(info) {
	const path = info.path
	streamDecks[path] = await openStreamDeck(path)

	console.log(info)
	console.log('Serial:', await streamDecks[path].getSerialNumber())
	console.log('Firmware:', await streamDecks[path].getFirmwareVersion())

	// Clear all keys
	await streamDecks[path].clearPanel()
	// Fill one key in red
	await streamDecks[path].fillKeyColor(0, 255, 0, 0)

	await streamDecks[path].resetToLogo()

	streamDecks[path].on('error', (e) => {
		console.log(e)
		// assuming any error means we lost connection
		streamDecks[path].removeAllListeners()
		delete streamDecks[path]
	})
	//  add any other event listeners
}

async function refresh() {
	const streamdecks = await listStreamDecks()
	streamdecks.forEach((device) => {
		if (!streamDecks[device.path]) {
			addDevice(device).catch((e) => console.error('Add failed:', e))
		}
	})
}
refresh()

usb.on('attach', function (e) {
	if (e.deviceDescriptor.idVendor === VENDOR_ID || e.deviceDescriptor.idVendor === CORSAIR_VENDOR_ID) {
		refresh()
	}
})
usb.on('detach', function (e) {
	if (e.deviceDescriptor.idVendor === VENDOR_ID || e.deviceDescriptor.idVendor === CORSAIR_VENDOR_ID) {
		console.log(`${JSON.stringify(e.deviceDescriptor)} was removed`)
		refresh()
	}
})
