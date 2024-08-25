module.exports = {
	moduleFileExtensions: ['ts', 'js', 'json'],
	transform: {
		'^.+\\.(ts|tsx)$': [
			'ts-jest',
			{
				tsconfig: 'tsconfig.json',
				diagnostics: false,
			},
		],
	},
	testMatch: ['**/__tests__/**/*.spec.(ts|js)'],
	testPathIgnorePatterns: ['integrationTests'],
	testEnvironment: 'node',
	coverageThreshold: {
		global: {
			branches: 0,
			functions: 0,
			lines: 0,
			statements: 0,
		},
	},
	collectCoverageFrom: [
		'**/src/**/*.{ts,js}',
		'!**/src/__tests__/**',
		'!**/node_modules/**',
		'!**/dist/**',
		'!packages/webhid-demo/**',
	],
	collectCoverage: true,
	projects: ['<rootDir>'],
	coverageDirectory: '<rootDir>/coverage/',

	preset: 'ts-jest',

	moduleNameMapper: {
		'@elgato-stream-deck/(.+)': '<rootDir>/packages/$1/src',
		'^(..?/.+).js?$': '$1',
	},
}
