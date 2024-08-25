const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { ProvidePlugin, DefinePlugin } = require('webpack')

module.exports = {
	// Where to fine the source code
	context: path.join(__dirname, '/src'),

	// No source map for production build
	devtool: 'source-map',

	entry: path.join(__dirname, '/src/app.ts'),

	optimization: {
		// We no not want to minimize our code.
		minimize: false,
	},

	output: {
		// The destination file name concatenated with hash (generated whenever you change your code).
		// The hash is really useful to let the browser knows when it should get a new bundle
		// or use the one in cache
		filename: 'app.js',

		// The destination folder where to put the output bundle
		path: path.join(__dirname, '/dist'),

		// Wherever resource (css, js, img) you call <script src="..."></script>,
		// or css, or img use this path as the root
		publicPath: '/',

		// At some point you'll have to debug your code, that's why I'm giving you
		// for free a source map file to make your life easier
		sourceMapFilename: 'main.map',
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	devServer: {
		static: {
			directory: path.join(__dirname, '/public'),
			// match the output path
			publicPath: '/',
		},
		// match the output `publicPath`
		historyApiFallback: true,
	},

	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},

	plugins: [
		new CopyWebpackPlugin({
			patterns: [{ from: path.join(__dirname, '/public'), to: path.join(__dirname, '/dist') }],
		}),
		new DefinePlugin({
			LIB_VERSION: JSON.stringify(process.env.npm_package_version || ''),
		}),
	],
}
