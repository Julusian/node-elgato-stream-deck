import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

const baseConfig = await generateEslintConfig({
	enableTypescript: true,
})

const customConfig = [
	...baseConfig,

	{
		files: ['**/*.ts', '**/*.tsx'],
		rules: {
			'@typescript-eslint/consistent-type-imports': 'error',
		},
	},

	{
		files: ['**/examples/*.js', '**/*.cjs'],
		rules: {
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
	{
		files: ['**/__tests__/**/*', '**/examples/**/*'],
		rules: {
			'n/no-extraneous-require': 'off',
			'n/no-extraneous-import': 'off',
		},
	},
	{
		files: ['packages/webhid-demo/src/**/*'],
		rules: {
			'@typescript-eslint/no-require-imports': 'off',
			'n/no-missing-import': 'off',
		},
	},
]

export default customConfig
