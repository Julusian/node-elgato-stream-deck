module.exports = {
	extends: './node_modules/@sofie-automation/code-standard-preset/eslint/main',
	root: true,
	overrides: [
		{
			files: ['*.ts'],
			parserOptions: {
				tsconfigRootDir: __dirname,
				project: ['./packages/*/tsconfig.json'],
			},
		},
		{
			files: ['packages/*/examples/**/*.js', 'packages/*/examples/**/*.ts'],
			rules: {
				'node/no-extraneous-import': 'off',
				'node/no-extraneous-require': 'off',
			},
		},
	],
}
