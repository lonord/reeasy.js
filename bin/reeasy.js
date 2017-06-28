#!/usr/bin/env node

const program = require('commander')
const package = require('../package.json')
const builder = require('../lib/builder')
const server = require('../lib/server')

let handled = false

program
	.version(package.version)
	.usage('<dev|build|start>')

program	
	.command('build')
	.description('Run reeasy to build files for production')
	.option('-c, --config <value>', 'Custom reeasy config file')
	.action((options) => {
		handled = true
		const cwd = process.cwd()
		process.env.NODE_ENV = 'production'
		Promise.resolve()
			.then(() => builder.readConfig(options.config, cwd))
			.then(config => builder.prepareWebpack(config, false, cwd))
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
		handled = true
		const cwd = process.cwd()
		process.env.NODE_ENV = 'production'
		let port = parseInt(options.port)
		if (isNaN(port)) {
			port = process.env.PORT || 3000
		}
		Promise.resolve()
			.then(() => builder.readConfig(options.config, cwd))
			.then(config => builder.getProdMiddleware(config, cwd))
			.then(middleWare => server.createServer(middleWare))
			.then(app => app.listen(port))
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
		handled = true
		const cwd = process.cwd()
		process.env.NODE_ENV = 'development'
		let port = parseInt(options.port)
		if (isNaN(port)) {
			port = process.env.PORT || 3000
		}
		Promise.resolve()
			.then(() => builder.readConfig(options.config, cwd))
			.then(config => {
				return builder.prepareWebpack(config, true, cwd).then(webpackConfig => ({
					webpackConfig: webpackConfig,
					config: config
				}))
			})
			.then(result => builder.getDevMiddleware(result.webpackConfig, result.config, cwd))
			.then(middleWare => server.createServer(middleWare))
			.then(app => app.listen(port))
			.then(() => {
				console.log('> Ready on http://localhost:' + port)
			})
			.catch(err => {
				console.error(`\nError: ${err.message || err}\n`)
			})
	})

program.parse(process.argv);

if (!handled) {
	program.help()
}