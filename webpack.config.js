const path = require('path');
const env = require('yargs').argv.env;
const libraryName = 'EventHub';
let outputFile;
let plugins = [];

if(env === 'build') {
	outputFile = libraryName + '.min.js';
} else {
	outputFile = libraryName + '.js';
}

module.exports = {
	entry: __dirname + '/src/EventHub.js',
	devtool: 'source-map',
	output: {
		path: __dirname + '/lib',
		filename: outputFile,
		library: libraryName,
		libraryTarget: 'umd',
		umdNamedDefine: true,
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				loader: 'babel-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.js$/,
				loader: 'eslint-loader',
				exclude: /node_modules/,
			},
		],
	},
	optimization: {
		minimize: (env === 'build'),
	},
	resolve: {
		modules: [
			path.resolve(__dirname, 'src'),
			'node_modules',
		],
		extensions: ['.json', '.js'],
	},
	plugins: plugins,
};
