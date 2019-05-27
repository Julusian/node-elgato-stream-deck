module.exports = {
	globals: {
		'ts-jest': {
			tsConfig: 'tsconfig.json',
			diagnostics: false
		}
	},
	moduleFileExtensions: [
		'ts',
		'js'
	],
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest'
	},
	testMatch: [
		'**/__tests__/**/*.spec.(ts|js)'
	],
	testPathIgnorePatterns: [
		'integrationTests'
	],
	testEnvironment: 'node',
	coverageThreshold: {
		global: {
		  branches: 0,
		  functions: 0,
		  lines: 0,
		  statements: 0
		}
	},
	collectCoverageFrom: [
		"**/src/**/*.{ts,js}",
		"!**/src/__test__/**",
		"!**/node_modules/**",
		"!**/dist/**"
	],
	coverageDirectory: "./coverage/",
	collectCoverage: true
}
