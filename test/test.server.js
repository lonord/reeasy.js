const assert = require('assert')
const request = require('supertest')
const path = require('path')
const rimraf = require('rimraf-then')
const server = require('../lib/server')
const builder = require('../lib/builder')

describe('test server', () => {

	afterEach(async () => {
		await rimraf(path.join(__dirname, 'test.builder.env1/.reeasy'))
		await rimraf(path.join(__dirname, 'test.builder.env1/.dist'))
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
		await request(app).get('/bundle.js').expect(200)
		
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
		await request(app).get('/bundle.js').expect(200)
	})
})