const usbDetect = require('usb-detection');
const StreamDeck = require('../dist/index');
const streamDecks = {}

function addDevice (path) {
	streamDecks[path] = new StreamDeck(path)

	const info = StreamDeck.getDeviceInfo(path)
	console.log(info)

	// Clear all keys
	streamDecks[path].clearAllKeys()
	// Fill one key in red
	streamDecks[path].fillColor(0, 255, 0, 0)

	streamDecks[path].on('error', (e) => {
		console.log(e)
		// assuming any error means we lost connection
		streamDecks[path].removeAllListeners()
		delete streamDecks[path]
	})
	//  add any other event listeners
}

function refresh () {
	const streamdecks = StreamDeck.listDevices()
	streamdecks.forEach(device => {
		if (!streamDecks[device.path]) {
			addDevice(device.path)
		}
	})
}
refresh()

usbDetect.startMonitoring();

usbDetect.on('add:4057:96', function(device) {
	refresh()
})

