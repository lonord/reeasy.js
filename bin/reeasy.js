#!/usr/bin/env node

const program = require('commander')
const package = require('../package.json')
const builder = require('../lib/builder')
const server = require('../lib/server')

program
	.version(package.version)
	.usage('<dev|build|start>')

program	
	.command('build')
	.description('Run reeasy to build files for production')
	.option('-c, --config <value>', 'Custom reeasy config file')
	.action((options) => {
		process.env.NODE_ENV = 'production'
		Promise.resolve()
			.then(() => builder.readConfig(options.config))
			.then(config => builder.prepareWebpack(config, true))
			.then(webpackConfig => builder.build(webpackConfig))
			.catch(err => {
				console.error(`\nError: ${err.message || err}\n`)
			})
	})

program	
	.command('start')
	.description('Run reeasy in development mode')
	.option('-p, --port <n>', 'Port to listen for http server')
	.action((options) => {
		process.env.NODE_ENV = 'production'
		let port = parseInt(options.port)
		if (isNaN(port)) {
			port = process.env.PORT || 3000
		}
		Promise.resolve()
			.then(() => builder.readConfig(options.config))
			.then(config => builder.getProdMiddleware(config))
			.then(middleWare => server.createServer(middleWare, port))
			.then(() => {
				console.log('> Ready on http://localhost:' + port)
			})
			.catch(err => {
				console.error(`\nError: ${err.message || err}\n`)
			})
	})

program	
	.command('dev')
	.description('Run reeasy in development mode, with HMR support')
	.option('-c, --config <value>', 'Custom reeasy config file')
	.option('-p, --port <n>', 'Port to listen for http server')
	.action((options) => {
		process.env.NODE_ENV = 'development'
		let port = parseInt(options.port)
		if (isNaN(port)) {
			port = process.env.PORT || 3000
		}
		Promise.resolve()
			.then(() => builder.readConfig(options.config))
			.then(config => ({
				webpackConfig: builder.prepareWebpack(config, false),
				config: config
			}))
			.then(result => builder.getDevMiddleware(result.webpackConfig, result.config))
			.then(middleWare => server.createServer(middleWare, port))
			.then(() => {
				console.log('> Ready on http://localhost:' + port)
			})
			.catch(err => {
				console.error(`\nError: ${err.message || err}\n`)
			})
	})

program.parse(process.argv);