const express = require('express')
const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const webpack = require('webpack')
const isFunction = require('lodash.isfunction')
const findIndex = require('lodash.findindex')
const devMiddleware = require("webpack-dev-middleware")
const hotMiddleware = require("webpack-hot-middleware")

const templateEntryProvider = require('./template-entry-provider')
const webpackConfigProvider = require('./webpack')

const CONFIG_FILE_NAME = 'reeasy.config.js'
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

const app = express()
const dev = process.env.NODE_ENV !== 'production'
const cwd = process.cwd()
const tmpdir = path.join(cwd, '.reeasy')

//read config file in cwd
let config;
try {
	config = Object.assign({}, DEFAULT_CONFIG, require(path.join(cwd, CONFIG_FILE_NAME)))
}
catch (e) {
	console.log('\nError: A config file `easy.config.js` in root directory of your project is required!\n')
	process.exit(1)
}
if (!config.rootPath) {
	console.log('\nError: `rootPath` is required in config file!\n')
	process.exit(1)
}
try {
	fs.statSync(path.join(cwd, config.indexHTML))
}
catch (e) {
	console.log('\nError: File specified in `indexHTML` could not be found!\n')
	process.exit(1)
}

//listening port of server
const port = config.port || process.env.PORT || 3000

//generate entry file
try {
	rimraf.sync(tmpdir)
}
catch (e) {}	
mkdirp.sync(tmpdir)
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
	selector = `document.getElementsByTagName('${config.selector.substr(1)}')[0]`
}
fs.writeFileSync(entryFilePath, dev
	? templateEntryProvider.getEntryDev(rootComponentPath, selector)
	: templateEntryProvider.getEntryProd(rootComponentPath, selector))

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

const compiler = webpack(webpackConfig)

app.use(devMiddleware(compiler, {
	noInfo: true,
	publicPath: webpackConfig.output.publicPath
}))

app.use(hotMiddleware(compiler))

app.get('*', (req, res) => {
	res.set('Content-Type', 'text/html')
	res.sendFile(path.join(cwd, config.indexHTML))
})

app.listen(port, err => {
	if (err) {
		throw err
	}
	console.log('> Ready on http://localhost:' + port)
})