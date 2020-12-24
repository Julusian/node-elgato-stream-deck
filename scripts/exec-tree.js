const concurrently = require('concurrently');

(async () => {
	try {
		console.log('Starting watchers');
		// Now run everything
		await concurrently(
			[
				{
					command: 'yarn workspace @companion/module-framework watch',
					name: 'FRAMEWORK',
				},
				{
					command: `yarn workspace companion3 ${process.env.ELECTRON ? 'dev-electron' : 'dev-server'}`,
					name: 'SERVER',
					prefixColor: 'bgBlue.bold',
					env: {
						MONGO_URL: mongoUrl,
						DEVELOPER: 1,
					},
				},
				{
					command: 'yarn workspace companion3 dev-client',
					name: 'CLIENT',
					prefixColor: 'bgGreen.bold',
				},
			],
			{
				prefix: 'name',
				killOthers: ['failure', 'success'],
				restartTries: 3,
			},
		);
		console.log('Done!');
		process.exit();
	} catch (err) {
		console.error(`Failure: ${err}`);
		process.exit(1);
	}
})();
