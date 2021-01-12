const concurrently = require('concurrently')

let devServerFlags = ''
if ('DEVSERVER_FLAGS' in process.env) {
	devServerFlags = process.env.DEVSERVER_FLAGS
}

;(async () => {
	try {
		console.log('Starting watchers')
		// Now run everything
		await concurrently(
			[
				{
					command: 'yarn workspace @elgato-stream-deck/core build:main --watch',
					prefixColor: 'bgBlue.bold',
					name: 'CORE',
				},
				{
					command: 'yarn workspace @elgato-stream-deck/node build:main --watch',
					prefixColor: 'bgGreen.bold',
					name: 'NODE',
				},
				{
					command: 'yarn workspace @elgato-stream-deck/webhid build:main --watch',
					prefixColor: 'bgPink.bold',
					name: 'WEB',
				},
				{
					command: 'yarn workspace @elgato-stream-deck/webhid-demo start ' + devServerFlags,
					prefixColor: 'bgRed.bold',
					name: 'DEMO',
				},
			],
			{
				prefix: 'name',
				killOthers: ['failure', 'success'],
				restartTries: 3,
			}
		)
		console.log('Done!')
		process.exit()
	} catch (err) {
		console.error(`Failure: ${err}`)
		process.exit(1)
	}
})()
