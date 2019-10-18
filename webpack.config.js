const path = require('path');
const mode = require('yargs').argv.mode;
const libraryName = 'EventHub';

const load = (regex, loader) => ({
	test: regex,
	loader,
	exclude: /node_modules/,
});

module.exports = {
	entry: path.resolve(__dirname, 'src/EventHub.ts'),
	devtool: 'source-map',
	output: {
		path: path.resolve(__dirname, 'lib'),
		filename: libraryName + ((mode === 'production') ? '.min.js' : '.js'),
		library: libraryName,
		libraryTarget: 'umd',
		libraryExport: 'default',
		umdNamedDefine: true,
	},
	module: {
		rules: [
			load(/\.(j|t)s$/, 'babel-loader'),
			load(/\.js$/, 'eslint-loader'),
		],
	},
	resolve: {
		extensions: ['.js', '.ts', '.json'],
	},
	optimization: {
		minimize: (mode === 'production'),
	},
};
