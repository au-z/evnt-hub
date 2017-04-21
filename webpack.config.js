'use strict';

const webpack = require('webpack');
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
const path = require('path');
const env = require('yargs').argv.env;
const libraryName = 'EventHub';
let outputFile;
let plugins = [];

if(env === 'build') {
	plugins.push(new UglifyJsPlugin({minimize: true}));
	outputFile = libraryName + '.min.js';
} else {
	outputFile = libraryName + '.js';
}

let config = {
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
	resolve: {
		modules: [
			path.resolve(__dirname, 'src'),
			'node_modules',
		],
		extensions: ['.json', '.js'],
	},
	plugins: plugins,
};

module.exports = config;
