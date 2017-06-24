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

const routerCreator = require('./router')
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
	outDir: '.dist',
	bundleName: 'bundle.js',
	publicPath: '/',
	indexHTML: 'index.html',
	selector: 'body'
}
const cwd = process.cwd()
const tmpdir = path.join(cwd, TMP_DIR)

module.exports = {
	readConfig: configFile => {
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
				config = configFile
			}
			if (!config.rootPath) {
				throw new Error('`rootPath` is required in config file!')
			}
			return stat(path.join(cwd, config.indexHTML)).catch(() => {
				throw new Error('File specified in `indexHTML` could not be found!')
			}).then(() => config)
		})
	},

	prepareWebpack: (config, dev) => {
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
			}).then(() => {
				return writeFile(entryFilePath, dev
					? templateEntryProvider.getEntryDev(rootComponentPath, selector)
					: templateEntryProvider.getEntryProd(rootComponentPath, selector))
			}).then(() => ({
				config: config,
				entryFilePath: entryFilePath
			}))
		}).then(obj => {
			const config = obj.config
			const entryFilePath = obj.entryFilePath
			const webpackConfig = webpackConfigProvider.createConfig({
				dev: dev,
				entryFile: entryFilePath,
				outDir: path.join(cwd, config.outDir),
				bundleFileName: config.bundleName,
				publicPath: config.publicPath
			})

			//babel-loader custom config
			if (isFunction(config.babelLoaderConfig)) {
				let idx = findIndex(webpackConfig.module.loaders, item => item._babel_loader_ === true)
				let babelConfig = config.babelLoaderConfig(webpackConfig.module.loaders[idx])
				webpackConfig.module.loaders.splice(idx, 1, babelConfig)
			}

			//webpack custom config
			if (isFunction(config.webpack)) {
				webpackConfig = config.webpack(webpackConfig, dev)
			}

			return webpackConfig
		})
	},

	build: (webpackConfig) => {
		return new Promise(resolve => {
			const compiler = webpack(webpackConfig)
			compiler.run((err, stats) => {
				if (err) {
					console.error(err);
					resolve()
					return;
				}
				console.log(stats.toString({
					chunks: false,  // Makes the build much quieter
					colors: true    // Shows colors in the console
				}));
				resolve()
			})
		})
	},

	getDevMiddleware: (webpackConfig, config) => {
		const compiler = webpack(webpackConfig)
		let router = routerCreator()

		router.use(devMiddleware(compiler, {
			noInfo: true,
			publicPath: webpackConfig.output.publicPath
		}))

		router.use(hotMiddleware(compiler))

		router.use(config.publicPath, serveStatic(path.join(cwd, config.outDir), {
			index: false
		}))

		router.use((req, res) => {
			let htmlFilePath = path.join(cwd, config.indexHTML)
			res.setHeader('Content-Type', 'text/html')
			fs.createReadStream(htmlFilePath, { encoding: 'utf8' }).pipe(res)
		})
		
		return router
	},

	getProdMiddleware: (config) => {
		let router = routerCreator()

		router.use(config.publicPath, serveStatic(path.join(cwd, config.outDir), {
			index: false
		}))

		router.use((req, res) => {
			let htmlFilePath = path.join(cwd, config.indexHTML)
			res.setHeader('Content-Type', 'text/html')
			fs.createReadStream(htmlFilePath, { encoding: 'utf8' }).pipe(res)
		})
		
		return router
	}
}