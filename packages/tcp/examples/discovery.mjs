import { StreamDeckTcpDiscoveryService } from '../dist/index.js'

const discover = new StreamDeckTcpDiscoveryService()
discover.on('up', (service) => {
	console.log('up', service)
})
discover.on('down', (service) => {
	console.log('down', service)
})

setInterval(() => {
	// discover.query()
}, 5000)
