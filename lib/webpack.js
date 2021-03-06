/*
 * Created on Fri Jun 30 2017
 *
 * Copyright (c) 2017 Loy B. <lonord@qq.com>
 */
const fs = require('fs')
const path = require('path')
const webpack = require('webpack')

module.exports = {
	createConfig: ({ dev, entryFile, outDir, bundleFileName, publicPath }) => {
		let cfg = {
			entry: [
				entryFile
			],
			output: {
				path: outDir,
				filename: bundleFileName,
				publicPath: publicPath
			},
			module: {
				loaders: []
			},
			resolve: {
				extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
			},
			plugins: [
				new webpack.DefinePlugin({
					'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production')
				})
			]
		}

		let babelLoaderConfig = {
			test: /\.jsx?$/,
			exclude: /node_modules/,
			use: {
				loader: 'babel-loader',
				options: {
					presets: [
						['env', { "modules": false }],
						'react'
					],
					plugins: [
						["transform-class-properties", { "spec": true }],
						'transform-es2015-modules-commonjs',
						'transform-es2015-spread',
						'transform-object-rest-spread',
						[
							"transform-runtime",
							{
								"helpers": false,
								"polyfill": false,
								"regenerator": true,
								"moduleName": "babel-runtime"
							}
						]
					],
					cacheDirectory: dev
				}
			},
			_babel_loader_: true
		}		

		if (dev) {
			//entry
			cfg.entry.unshift('webpack-hot-middleware/client?reload=true&timeout=5000')
			cfg.entry.unshift('react-hot-loader/patch')
			cfg.entry.unshift('eventsource-polyfill')

			//devtool
			cfg.devtool = 'inline-source-map'

			//plugins
			cfg.plugins.push(new webpack.HotModuleReplacementPlugin())
			cfg.plugins.push(new webpack.NamedModulesPlugin())

			//babelLoaderConfig
			babelLoaderConfig.use.options.plugins.unshift('react-hot-loader/babel')
		}
		else {
			//plugins
			cfg.plugins.push(new webpack.optimize.UglifyJsPlugin({
				compress: {
					warnings: false
				},
				comments: false,
				sourceMap: false
			}))
		}

		//add babel loader to webpack config		
		cfg.module.loaders.unshift(babelLoaderConfig)

		return cfg
	}
}