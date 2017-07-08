/*
 * Created on Fri Jun 30 2017
 *
 * Copyright (c) 2017 Loy B. <lonord@qq.com>
 */
const express = require('express')
const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp-then')
const rimraf = require('rimraf-then')
const bluebird = require('bluebird').noConflict()
const webpack = require('webpack')
const serveStatic = require('serve-static')
const isFunction = require('lodash.isfunction')
const findIndex = require('lodash.findindex')
const isString = require('lodash.isstring')
const devMiddleware = require("webpack-dev-middleware")
const hotMiddleware = require("webpack-hot-middleware")
const isWindowsBash = require('is-windows-bash')
const touch = require("touch")

const routerCreate = require('./router')
const templateEntryProvider = require('./template-entry-provider')
const webpackConfigProvider = require('./webpack')

const stat = bluebird.promisify(fs.stat)
const writeFile = bluebird.promisify(fs.writeFile)

const CONFIG_FILE_NAME = 'reeasy.config.js'
const TMP_DIR = '.reeasy'
const DEFAULT_CONFIG = {
	/*rootPath: required*/
	/*webpack: function (config) -> newConfig*/
	/*babelLoaderConfig: function (config) -> newConfig*/
	/*devMiddlewareConfig: function (config) -> newConfig*/
	outDir: '.dist',
	bundleName: 'bundle.js',
	publicPath: '/',
	indexHTML: './index.html',
	selector: 'div'
}

const ignored = [
	/(^|[/\\])\../, // .dotfiles
	/node_modules/,
	/\.reeasy/
]

const timeAgo = sec => {
	let now = new Date()
	return new Date(now.getTime() - sec * 1000)
}

//change file timestamp in order to avoid webpack watching problem
//see the issue: https://github.com/webpack/watchpack/issues/53
const touchFile = filePath => {
	return new Promise(resolve => {
		touch(filePath, {
			time: timeAgo(10)
		}, resolve)
	})
}

const findHtmlFile = (cwd, config) => {
	const p1 = path.join(cwd, config.indexHTML)
	const p2 = path.join(cwd, 'index.html')
	const p3 = path.join(cwd, config.outDir, 'index.html')
	const p4 = path.join(cwd, config.outDir, config.publicPath, 'index.html')
	return stat(p1).then(() => p1)
		.catch(() => stat(p2).then(() => p2))
		.catch(() => stat(p3).then(() => p3))
		.catch(() => stat(p4).then(() => p4))
}

const koaMiddleware = router => {
	return (ctx, next) => {
		ctx.res.statusCode = 200
		router(ctx.req, ctx.res)
		ctx.respond = false
	}
}

module.exports = {
	readConfig: (configFile, cwd) => {
		return Promise.resolve().then(() => {
			let config;
			if (!configFile || isString(configFile)) {
				//read config file in cwd
				try {
					config = Object.assign({}, DEFAULT_CONFIG, require(path.join(cwd, configFile || CONFIG_FILE_NAME)))
				}
				catch (e) {
					throw new Error('A config file `easy.config.js` in root directory of your project is required!')
				}
			}
			else {
				//configFile is the configure object
				config = Object.assign({}, DEFAULT_CONFIG, configFile)
			}
			if (!config.rootPath) {
				throw new Error('`rootPath` is required in config file!')
			}
			return config
		})
	},

	prepareWebpack: (config, dev, cwd) => {
		const tmpdir = path.join(cwd, TMP_DIR)
		return Promise.resolve().then(() => {
			//generate entry file
			return rimraf(tmpdir).then(() => mkdirp(tmpdir)).catch(() => {
				throw new Error('Cannot access temp directory `' + TMP_DIR + '`')
			}).then(() => {
				const entryFilePath = path.join(tmpdir, `__entry.js`)
				const rootComponentPath = path.relative(tmpdir, path.join(cwd, config.rootPath))
				let selector = ''
				if (config.selector.indexOf('#') === 0) {
					selector = `document.getElementById('${config.selector.substr(1)}')`
				}
				else if (config.selector.indexOf('.') === 0) {
					selector = `document.getElementsByClassName('${config.selector.substr(1)}')[0]`
				}
				else {
					selector = `document.getElementsByTagName('${config.selector}')[0]`
				}
				return writeFile(entryFilePath, dev
					? templateEntryProvider.getEntryDev(rootComponentPath, selector)
					: templateEntryProvider.getEntryProd(rootComponentPath, selector))
					.then(() => touchFile(entryFilePath))
					.then(() => entryFilePath)
			}).then(entryFilePath => ({
				config: config,
				entryFilePath: entryFilePath
			}))
		}).then(obj => {
			const config = obj.config
			const entryFilePath = obj.entryFilePath
			let webpackConfig = webpackConfigProvider.createConfig({
				dev: dev,
				entryFile: entryFilePath,
				outDir: path.join(cwd, config.outDir, config.publicPath),
				bundleFileName: config.bundleName,
				publicPath: config.publicPath
			})

			//babel-loader custom config
			if (isFunction(config.babelLoaderConfig)) {
				let idx = findIndex(webpackConfig.module.loaders, item => item._babel_loader_ === true)
				if (idx >= 0) {
					let babelConfig = config.babelLoaderConfig(Object.assign({}, webpackConfig.module.loaders[idx]), dev)
					if (!babelConfig) {
						throw new Error('Function `babelLoaderConfig` in reeasy config must return the new config')
					}
					webpackConfig.module.loaders.splice(idx, 1, babelConfig)
				}	
			}

			//webpack custom config
			if (isFunction(config.webpack)) {
				webpackConfig = config.webpack(Object.assign({}, webpackConfig), dev)
				if (!webpackConfig) {
					throw new Error('Function `webpack` in reeasy config must return the new config')
				}
			}

			let idx = findIndex(webpackConfig.module.loaders, item => item._babel_loader_ === true)
			if (idx >= 0) {
				delete webpackConfig.module.loaders[idx]._babel_loader_
			}

			return webpackConfig
		})
	},

	build: (webpackConfig) => {
		return new Promise(resolve => {
			const compiler = webpack(webpackConfig)
			compiler.run((err, stats) => {
				if (err) {
					throw err
				}
				if (stats.hasErrors()) {
					throw new Error(stats.toString({
						chunks: false,  // Makes the build much quieter
						colors: true    // Shows colors in the console
					}))
				}
				resolve(stats.toString({
					chunks: false,  // Makes the build much quieter
					colors: true    // Shows colors in the console
				}));
			})
		})
	},

	getDevMiddleware: (webpackConfig, config, cwd) => {
		return rimraf(path.join(cwd, config.outDir)).then(() => {
			return new Promise(resolve => {
				const compiler = webpack(webpackConfig)
				let router = routerCreate()

				const windowsSettings = isWindowsBash() ? {
					lazy: false,
					watchOptions: {
						ignored: ignored,
						aggregateTimeout: 300,
						poll: true
					}
				} : {}

				let devMiddlewareConfig = Object.assign({
					noInfo: true,
					publicPath: webpackConfig.output.publicPath,
					watchOptions: {
						ignored: ignored
					},
					stats: {
						colors: true
					}
				}, windowsSettings)

				if (isFunction(config.devMiddlewareConfig)) {
					devMiddlewareConfig = config.devMiddlewareConfig(Object.assign({}, devMiddlewareConfig))
					if (!devMiddlewareConfig) {
						throw new Error('Function `devMiddlewareConfig` in reeasy config must return the new config')
					}
				}

				let middlewareInstance = devMiddleware(compiler, devMiddlewareConfig)

				router.use(middlewareInstance)

				router.use(hotMiddleware(compiler, {
					heartbeat: 2500
				}))

				router.use(config.publicPath, serveStatic(path.join(cwd, config.outDir), {
					index: false
				}))

				router.use((req, res, next) => {
					findHtmlFile(cwd, config).then(htmlFilePath => {
						res.setHeader('Content-Type', 'text/html')
						fs.createReadStream(htmlFilePath, {
							encoding: 'utf8'
						}).pipe(res)
					}).catch(() => {
						const err = new Error('Could not find html file specified in `indexHTML`, please check!')
						err.status = 404
						next(err)
					})
				})

				router.closeWebpack = () => {
					return new Promise(resolve => middlewareInstance.close(resolve))
				}

				router.koa = () => {
					return koaMiddleware(router)
				}

				middlewareInstance.waitUntilValid(() => {
					middlewareInstance.waitUntilValid(() => {})
					resolve(router)
				})

			})
		})

	},

	getProdMiddleware: (config, cwd) => {
		return new Promise(resolve => {
			let router = routerCreate()

			router.use(config.publicPath, serveStatic(path.join(cwd, config.outDir), {
				index: false
			}))

			router.use((req, res, next) => {
				findHtmlFile(cwd, config).then(htmlFilePath => {
					res.setHeader('Content-Type', 'text/html')
					fs.createReadStream(htmlFilePath, {
						encoding: 'utf8'
					}).pipe(res)
				}).catch(() => {
					next()
				})
			})

			router.koa = () => {
				return koaMiddleware(router)
			}

			resolve(router)
		})

	}
}