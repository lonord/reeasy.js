const assert = require('assert')
const request = require('supertest')
const path = require('path')
const rimraf = require('rimraf-then')
const express = require('express')
const server = require('../lib/server')
const builder = require('../lib/builder')
const index = require('../lib/index')

describe('test server', () => {

	afterEach(async () => {
		await rimraf(path.join(__dirname, 'test.builder.env1/.reeasy'))
		await rimraf(path.join(__dirname, 'test.builder.env1/.dist'))
		await rimraf(path.join(__dirname, 'test.builder.env5/.reeasy'))
		await rimraf(path.join(__dirname, 'test.builder.env5/.dist'))
	})
	
	it('server in development mode should run success', async () => {
		let cwd = path.join(__dirname, 'test.builder.env1')
		let config = await builder.readConfig(null, cwd)
		assert.ok(!!config)
		let webpackConfig = await builder.prepareWebpack(config, true, cwd)
		let middleWare = await builder.getDevMiddleware(webpackConfig, config, cwd)
		assert.ok(!!middleWare)
		let app = server.createServer(middleWare).getApp()

		await request(app).get('/').expect(200).expect('Content-Type', 'text/html')
		await request(app).get('/bundle.js').expect(200).expect('Content-Type', /application\/javascript/)
		
		await middleWare.closeWebpack()
	})

	it('server in production mode should run success', async () => {
		let cwd = path.join(__dirname, 'test.builder.env1')
		let config = await builder.readConfig(null, cwd)
		assert.ok(!!config)
		let webpackConfig = await builder.prepareWebpack(config, false, cwd)
		await builder.build(webpackConfig)
		let middleWare = await builder.getProdMiddleware(config, cwd)
		assert.ok(!!middleWare)
		let app = server.createServer(middleWare).getApp()

		await request(app).get('/').expect(200).expect('Content-Type', 'text/html')
		await request(app).get('/bundle.js').expect(200).expect('Content-Type', /application\/javascript/)
	})

	it('built-in server in development mode should run success', async () => {
		let cwd = path.join(__dirname, 'test.builder.env1')
		let config = await builder.readConfig(null, cwd)
		assert.ok(!!config)
		let webpackConfig = await builder.prepareWebpack(config, true, cwd)
		let middleWare = await builder.getDevMiddleware(webpackConfig, config, cwd)
		assert.ok(!!middleWare)
		let app = server.createServer(middleWare)
		await app.listen(3003)

		await new Promise(resolve => {
			setTimeout(resolve, 5000)
		})

		await request('http://localhost:3003').get('/').expect(200).expect('Content-Type', 'text/html')
		await request('http://localhost:3003').get('/bundle.js').expect(200).expect('Content-Type', /application\/javascript/)
		
		await middleWare.closeWebpack()
		app.close()
	})

	it('built-in server in production mode should run success', async () => {
		let cwd = path.join(__dirname, 'test.builder.env1')
		let config = await builder.readConfig(null, cwd)
		assert.ok(!!config)
		let webpackConfig = await builder.prepareWebpack(config, false, cwd)
		await builder.build(webpackConfig)
		let middleWare = await builder.getProdMiddleware(config, cwd)
		assert.ok(!!middleWare)
		let app = server.createServer(middleWare)
		await app.listen(3003)

		await request('http://localhost:3003').get('/').expect(200).expect('Content-Type', 'text/html')
		await request('http://localhost:3003').get('/bundle.js').expect(200).expect('Content-Type', /application\/javascript/)

		app.close()
	})

	it('custom server in development mode should run success', async () => {
		let cwd = path.join(__dirname, 'test.builder.env1')
		let reeasy = index({
			cwd: cwd,
			dev: true
		})
		let middleware = await reeasy.prepare()
		let app = express()
		app.use(middleware)

		await request(app).get('/').expect(200).expect('Content-Type', 'text/html')
		await request(app).get('/bundle.js').expect(200).expect('Content-Type', /application\/javascript/)
		
		await middleware.closeWebpack()
	})

	it('custom server in production mode should run success', async () => {
		let cwd = path.join(__dirname, 'test.builder.env1')
		let config = await builder.readConfig(null, cwd)
		assert.ok(!!config)
		let webpackConfig = await builder.prepareWebpack(config, false, cwd)
		await builder.build(webpackConfig)
		
		let reeasy = index({
			cwd: cwd,
			dev: false
		})
		let middleware = await reeasy.prepare()
		let app = express()
		app.use(middleware)

		await request(app).get('/').expect(200).expect('Content-Type', 'text/html')
		await request(app).get('/bundle.js').expect(200).expect('Content-Type', /application\/javascript/)
	})

	it('custom `publicPath` in development mode should run success', async () => {
		let cwd = path.join(__dirname, 'test.builder.env1')
		let reeasy = index({
			cwd: cwd,
			dev: true,
			conf: 'custom-reeasy-config3.js'
		})
		let middleware = await reeasy.prepare()
		let app = express()
		app.use(middleware)

		await request(app).get('/').expect(200).expect('Content-Type', 'text/html')
		await request(app).get('/app/bundle.js').expect(200).expect('Content-Type', /application\/javascript/)
		
		await middleware.closeWebpack()
	})

	it('custom `publicPath` in production mode should run success', async () => {
		let cwd = path.join(__dirname, 'test.builder.env1')
		let config = await builder.readConfig('custom-reeasy-config3.js', cwd)
		assert.ok(!!config)
		let webpackConfig = await builder.prepareWebpack(config, false, cwd)
		await builder.build(webpackConfig)
		
		let reeasy = index({
			cwd: cwd,
			dev: false,
			conf: 'custom-reeasy-config3.js'
		})
		let middleware = await reeasy.prepare()
		let app = express()
		app.use(middleware)

		await request(app).get('/').expect(200).expect('Content-Type', 'text/html')
		await request(app).get('/app/bundle.js').expect(200).expect('Content-Type', /application\/javascript/)
	})

	it('with `file-loader` in development mode should run success', async () => {
		let cwd = path.join(__dirname, 'test.builder.env5')
		let reeasy = index({
			cwd: cwd,
			dev: true
		})
		let middleware = await reeasy.prepare()
		let app = express()
		app.use(middleware)

		await request(app).get('/').expect(200).expect('Content-Type', 'text/html')
		await request(app).get('/my/bundle.js').expect(200).expect('Content-Type', /application\/javascript/)
		await request(app).get('/my/icon.png').expect(200).expect('Content-Type', /image\/png/)
		
		await middleware.closeWebpack()
	})

	it('with `file-loader` in production mode should run success', async () => {
		let cwd = path.join(__dirname, 'test.builder.env5')
		let config = await builder.readConfig(null, cwd)
		assert.ok(!!config)
		let webpackConfig = await builder.prepareWebpack(config, false, cwd)
		await builder.build(webpackConfig)
		
		let reeasy = index({
			cwd: cwd,
			dev: false,
		})
		let middleware = await reeasy.prepare()
		let app = express()
		app.use(middleware)

		await request(app).get('/').expect(200).expect('Content-Type', 'text/html')
		await request(app).get('/my/bundle.js').expect(200).expect('Content-Type', /application\/javascript/)
		await request(app).get('/my/icon.png').expect(200).expect('Content-Type', /image\/png/)
	})
})