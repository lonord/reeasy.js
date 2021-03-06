const assert = require('assert')
const path = require('path')
const webpack = require('webpack')
const rimraf = require('rimraf-then')
const find = require('lodash.find')
const fileExists = require('file-exists-promise')
const delay = require('timeout-as-promise')
const builder = require('../lib/builder')

describe('test builder', () => {

	describe('readConfig', () => {
		it('readConfig normally should run successfully', async() => {
			let cwd = path.join(__dirname, 'test.builder.env1')
			let config = await builder.readConfig(null, cwd)
			assert.ok(!!config)
			assert.equal(config.rootPath, './src/app.js')
			assert.equal(config.selector, '#root')
		})

		it('readConfig from custom path should run successfully', async() => {
			let cwd = path.join(__dirname, 'test.builder.env1')
			let config = await builder.readConfig('custom-reeasy-config.js', cwd)
			assert.ok(!!config)
			assert.equal(config.rootPath, './src/app.js')
			assert.equal(config.selector, '.root')
		})

		it('readConfig from custom path another should run successfully', async() => {
			let cwd = path.join(__dirname, 'test.builder.env1')
			let config = await builder.readConfig('custom-reeasy-config2.js', cwd)
			assert.ok(!!config)
			assert.equal(config.rootPath, './src/app.js')
			assert.equal(config.selector, 'article')
		})

		it('readConfig from object should run successfully', async() => {
			let cwd = path.join(__dirname, 'test.builder.env1')
			let config = await builder.readConfig({
				rootPath: './app.js',
				selector: '#root'
			}, cwd)
			assert.ok(!!config)
			assert.equal(config.rootPath, './app.js')
			assert.equal(config.selector, '#root')
		})

		it('readConfig cannot find config file `reeasy.config.js` should be fail', async() => {
			let cwd = path.join(__dirname, '.')
			try {
				let config = await builder.readConfig(null, cwd)
			} catch (e) {
				assert.equal(e.message, 'A config file `reeasy.config.js` in root directory of your project is required!')
				return
			}
			assert.fail('code should not reach here')
		})

		it('readConfig missing config `rootPath` should be fail', async() => {
			let cwd = path.join(__dirname, 'test.builder.env2')
			try {
				let config = await builder.readConfig(null, cwd)
			} catch (e) {
				assert.equal(e.message, '`rootPath` is required in config file!')
				return
			}
			assert.fail('code should not reach here')
		})

	})

	describe('prepareWebpack', () => {

		afterEach(async () => {
			await rimraf(path.join(__dirname, 'test.builder.env1/.reeasy'))
			await rimraf(path.join(__dirname, 'test.builder.env2/.reeasy'))
			await rimraf(path.join(__dirname, 'test.builder.env3/.reeasy'))
		})		

		it('prepareWebpack in development mode should run successfully', async() => {
			let cwd = path.join(__dirname, 'test.builder.env1')
			let config = await builder.readConfig(null, cwd)
			assert.ok(!!config)
			let webpackConfig = await builder.prepareWebpack(config, true, cwd)
			assert.ok(!!webpackConfig)
			assert.equal(webpackConfig.devtool, 'inline-source-map')
			assert.equal(webpackConfig.entry.length, 4)
			assert.equal(webpackConfig.entry[0], 'eventsource-polyfill')
			assert.ok(find(webpackConfig.entry, entry => entry == 'eventsource-polyfill'))
			assert.ok(find(webpackConfig.entry, entry => entry == 'react-hot-loader/patch'))
			assert.ok(find(webpackConfig.entry, entry => entry == 'webpack-hot-middleware/client?reload=true&timeout=5000'))
			assert.ok(find(webpackConfig.entry, entry => entry == path.join(cwd, './.reeasy/__entry.js')))
			assert.ok(find(webpackConfig.plugins, plugin => plugin instanceof webpack.DefinePlugin))
			assert.ok(find(webpackConfig.plugins, plugin => plugin instanceof webpack.HotModuleReplacementPlugin))
			assert.ok(find(webpackConfig.plugins, plugin => plugin instanceof webpack.NamedModulesPlugin))
			let entryFileStat = await fileExists(path.join(cwd, './.reeasy/__entry.js'))
			assert.ok(!!entryFileStat)
		})

		it('prepareWebpack in production mode should run successfully', async() => {
			let cwd = path.join(__dirname, 'test.builder.env1')
			let config = await builder.readConfig(null, cwd)
			assert.ok(!!config)
			let webpackConfig = await builder.prepareWebpack(config, false, cwd)
			assert.ok(!!webpackConfig)
			assert.ok(!webpackConfig.devtool)
			assert.equal(webpackConfig.entry.length, 1)
			assert.ok(find(webpackConfig.entry, entry => entry == path.join(cwd, './.reeasy/__entry.js')))
			assert.ok(find(webpackConfig.plugins, plugin => plugin instanceof webpack.DefinePlugin))
			assert.ok(find(webpackConfig.plugins, plugin => plugin instanceof webpack.optimize.UglifyJsPlugin))
			let entryFileStat = await fileExists(path.join(cwd, './.reeasy/__entry.js'))
			assert.ok(!!entryFileStat)
		})

		it('prepareWebpack in development mode with custom selector', async() => {
			let cwd = path.join(__dirname, 'test.builder.env1')
			let config = await builder.readConfig('custom-reeasy-config.js', cwd)
			assert.ok(!!config)
			let webpackConfig = await builder.prepareWebpack(config, true, cwd)
			assert.ok(!!webpackConfig)
			let entryFileStat = await fileExists(path.join(cwd, './.reeasy/__entry.js'))
			assert.ok(!!entryFileStat)
		})

		it('prepareWebpack in development mode with another custom selector', async() => {
			let cwd = path.join(__dirname, 'test.builder.env1')
			let config = await builder.readConfig('custom-reeasy-config2.js', cwd)
			assert.ok(!!config)
			let webpackConfig = await builder.prepareWebpack(config, true, cwd)
			assert.ok(!!webpackConfig)
			let entryFileStat = await fileExists(path.join(cwd, './.reeasy/__entry.js'))
			assert.ok(!!entryFileStat)
		})

		it('prepareWebpack in development mode with custom webpack and babel config', async() => {
			let cwd = path.join(__dirname, 'test.builder.env3')
			let config = await builder.readConfig(null, cwd)
			assert.ok(!!config)
			let webpackConfig = await builder.prepareWebpack(config, true, cwd)
			assert.ok(!!webpackConfig)
			assert.ok(find(webpackConfig.plugins, plugin => plugin instanceof webpack.BannerPlugin))
			assert.ok(find(webpackConfig.module.loaders[0].use.options.plugins, plugin => plugin == 'babel-plugin-my-dev'))
		})

		it('prepareWebpack in production mode with custom webpack and babel config', async() => {
			let cwd = path.join(__dirname, 'test.builder.env3')
			let config = await builder.readConfig(null, cwd)
			assert.ok(!!config)
			let webpackConfig = await builder.prepareWebpack(config, false, cwd)
			assert.ok(!!webpackConfig)
			assert.ok(find(webpackConfig.plugins, plugin => plugin instanceof webpack.IgnorePlugin))
			assert.ok(find(webpackConfig.module.loaders[0].use.options.plugins, plugin => plugin == 'babel-plugin-my-prod'))
		})

		it('prepareWebpack with custom function `webpack` with no return should be fail', async() => {
			let cwd = path.join(__dirname, 'test.builder.env1')
			try {
				let config = await builder.readConfig('custom-reeasy-config4.js', cwd)
				let webpackConfig = await builder.prepareWebpack(config, true, cwd)
			} catch (e) {
				assert.equal(e.message, 'Function `webpack` in reeasy config must return the new config')
				return
			}
			assert.fail('code should not reach here')
		})

		it('prepareWebpack with custom function `babelLoaderConfig` with no return should be fail', async() => {
			let cwd = path.join(__dirname, 'test.builder.env1')
			try {
				let config = await builder.readConfig('custom-reeasy-config5.js', cwd)
				let webpackConfig = await builder.prepareWebpack(config, true, cwd)
			} catch (e) {
				assert.equal(e.message, 'Function `babelLoaderConfig` in reeasy config must return the new config')
				return
			}
			assert.fail('code should not reach here')
		})
	})

	describe('build', () => {

		afterEach(async () => {
			await rimraf(path.join(__dirname, 'test.builder.env1/.reeasy'))
			await rimraf(path.join(__dirname, 'test.builder.env1/.dist'))
		})

		it('build in production mode', async () => {
			let cwd = path.join(__dirname, 'test.builder.env1')
			let config = await builder.readConfig(null, cwd)
			assert.ok(!!config)
			let webpackConfig = await builder.prepareWebpack(config, false, cwd)
			assert.ok(!!webpackConfig)
			let output = await builder.build(webpackConfig)
			assert.ok(!!output)
			let bundleFileStat = await fileExists(path.join(cwd, '.dist/bundle.js'))
			assert.ok(!!bundleFileStat)
			let bundleContent = fs.readFileSync(path.join(__dirname, 'test.builder.env1/.dist/bundle.js'), 'utf8')
			assert.ok(!(/\/\*/.test(bundleContent)))
		})

		it('build in production mode with custom `publicPath`', async () => {
			let cwd = path.join(__dirname, 'test.builder.env1')
			let config = await builder.readConfig('custom-reeasy-config3.js', cwd)
			assert.ok(!!config)
			let webpackConfig = await builder.prepareWebpack(config, false, cwd)
			assert.ok(!!webpackConfig)
			let output = await builder.build(webpackConfig)
			assert.ok(!!output)
			let bundleFileStat = await fileExists(path.join(cwd, '.dist/app/bundle.js'))
			assert.ok(!!bundleFileStat)
			let bundleContent = fs.readFileSync(path.join(__dirname, 'test.builder.env1/.dist/app/bundle.js'), 'utf8')
			assert.ok(!(/\/\*/.test(bundleContent)))
		})

	})

	describe('getDevMiddleware', () => {

		afterEach(async () => {
			await rimraf(path.join(__dirname, 'test.builder.env1/.reeasy'))
			await rimraf(path.join(__dirname, 'test.builder.env1/.dist'))
		})
		
		it('getDevMiddleware should success', async () => {
			let cwd = path.join(__dirname, 'test.builder.env1')
			let config = await builder.readConfig(null, cwd)
			assert.ok(!!config)
			let webpackConfig = await builder.prepareWebpack(config, true, cwd)
			let middleWare = await builder.getDevMiddleware(webpackConfig, config, cwd)
			assert.ok(!!middleWare)
			await middleWare.closeWebpack()
		})

		it('getDevMiddleware with custom function `devMiddlewareConfig` should success', async () => {
			let cwd = path.join(__dirname, 'test.builder.env1')
			let config = await builder.readConfig('custom-reeasy-config7.js', cwd)
			assert.ok(!!config)
			let webpackConfig = await builder.prepareWebpack(config, true, cwd)
			let middleWare = await builder.getDevMiddleware(webpackConfig, config, cwd)
			assert.ok(!!middleWare)
			await middleWare.closeWebpack()
		})

		it('getDevMiddleware with custom function `devMiddlewareConfig` with no return should be fail', async() => {
			let cwd = path.join(__dirname, 'test.builder.env1')
			try {
				let config = await builder.readConfig('custom-reeasy-config6.js', cwd)
				let webpackConfig = await builder.prepareWebpack(config, true, cwd)
				let middleWare = await builder.getDevMiddleware(webpackConfig, config, cwd)
				await middleWare.closeWebpack()
			} catch (e) {
				assert.equal(e.message, 'Function `devMiddlewareConfig` in reeasy config must return the new config')
				return
			}
			assert.fail('code should not reach here')
		})

	})

	describe('getProdMiddleware', () => {

		afterEach(async () => {
			await rimraf(path.join(__dirname, 'test.builder.env1/.reeasy'))
			await rimraf(path.join(__dirname, 'test.builder.env1/.dist'))
		})
		
		it('getProdMiddleware should success', async () => {
			let cwd = path.join(__dirname, 'test.builder.env1')
			let config = await builder.readConfig(null, cwd)
			assert.ok(!!config)
			let webpackConfig = await builder.prepareWebpack(config, false, cwd)
			let output = await builder.build(webpackConfig)
			assert.ok(!!output)
			let middleWare = await builder.getProdMiddleware(config, cwd)
			assert.ok(!!middleWare)
		})

	})

})