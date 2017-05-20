module.exports = {
	files: [
		'*.js',
		'test/fixtures/**'
	],

	tests: [
		'test/**/*.spec.js'
	],

	testFramework: 'ava',

	env: {
		type: 'node',
		runner: 'node'
	}
};
