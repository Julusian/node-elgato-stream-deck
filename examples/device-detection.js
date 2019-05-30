const usbDetect = require('usb-detection')
const { listStreamDecks, StreamDeck } = require('../dist/index')
const streamDecks = {}

function addDevice(info) {
	console.log(info)

	const path = info.path
	streamDecks[path] = new StreamDeck(path)

	// Clear all keys
	streamDecks[path].clearAllKeys()
	// Fill one key in red
	streamDecks[path].fillColor(0, 255, 0, 0)

	streamDecks[path].on('error', e => {
		console.log(e)
		// assuming any error means we lost connection
		streamDecks[path].removeAllListeners()
		delete streamDecks[path]
	})
	//  add any other event listeners
}

function refresh() {
	const streamdecks = listStreamDecks()
	streamdecks.forEach(device => {
		if (!streamDecks[device.path]) {
			addDevice(device)
		}
	})
}
refresh()

usbDetect.startMonitoring()

usbDetect.on('add:4057:96', function(device) {
	refresh()
})
