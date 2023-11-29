const { listStreamDecks } = require('../dist/index')
const HID = require('node-hid')

console.log('RAW HID')
for (const dev of HID.devices()) {
	console.log(dev)
}

console.log('STREAMDECKS')
listStreamDecks().then((devs) => {
	for (const dev of devs) {
		console.log(dev)
	}
})
