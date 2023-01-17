const { listStreamDecks } = require('../dist/index')
const HID = require('node-hid')

console.log('RAW HID')
for (const dev of HID.devices()) {
	console.log(dev)
}

console.log('STREAMDECKS')
for (const dev of listStreamDecks()) {
	console.log(dev)
}
