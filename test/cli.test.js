const coffee = require('coffee')
const child = require('child_process')
const path = require('path')
const rimraf = require('rimraf-then')
const request = require('supertest')

describe('test server', () => {

	afterEach(async () => {
		await rimraf(path.join(__dirname, 'test.builder.env1/.reeasy'))
		await rimraf(path.join(__dirname, 'test.builder.env1/.dist'))
		await rimraf(path.join(__dirname, 'test.builder.env4/.reeasy'))
		await rimraf(path.join(__dirname, 'test.builder.env4/.dist'))
	})

	it('reeasy show help info should success', done => {
		const expectStdout =
			'\n' +
			'  Usage: reeasy <dev|build|start>\n' +
			'\n' +
			'\n' +
			'  Commands:\n' +
			'\n' +
			'    build [options]   Run reeasy to build files for production\n' +
			'    start [options]   Run reeasy in development mode\n' +
			'    dev [options]     Run reeasy in development mode, with HMR support\n' +
			'\n' +
			'  Options:\n' +
			'\n' +
			'    -h, --help     output usage information\n' +
			'    -V, --version  output the version number\n' +
			'\n'
		
		coffee.spawn(path.join(__dirname, '../bin/reeasy.js'), {
			cwd: path.join(__dirname, 'test.builder.env1')
		})
			.expect('stdout', expectStdout)
			.expect('code', 0)
			.end(done)
	})
	

	it('reeasy build should success', done => {
		coffee.spawn(path.join(__dirname, '../bin/reeasy.js'), ['build'], {
			cwd: path.join(__dirname, 'test.builder.env1')
		})
			.expect('stdout', '')
			.expect('code', 0)
			.end(done)
	})

	it('reeasy build with custom config should success', done => {
		coffee.spawn(path.join(__dirname, '../bin/reeasy.js'), ['build', '-c', 'custom-reeasy-config.js'], {
			cwd: path.join(__dirname, 'test.builder.env1')
		})
			.expect('stdout', '')
			.expect('code', 0)
			.end(done)
	})

	it('reeasy build should fail', done => {
		coffee.spawn(path.join(__dirname, '../bin/reeasy.js'), ['build'], {
			cwd: path.join(__dirname, 'test.builder.env4')
		})
			.expect('stdout', '')
			.expect('stderr', /Error:/)
			.notExpect('code', 0)
			.end(done)
	})

	it('reeasy start should success', done => {
		coffee.spawn(path.join(__dirname, '../bin/reeasy.js'), ['build'], {
			cwd: path.join(__dirname, 'test.builder.env1')
		}).end(() => {
			let startCmd = child.spawn(path.join(__dirname, '../bin/reeasy.js'), ['start', '-p', '3003'], {
				cwd: path.join(__dirname, 'test.builder.env1')
			})
			request('http://localhost:3003')
				.get('/').expect(200).expect('Content-Type', 'text/html')
				.end(() => {
					request('http://localhost:3003')
						.get('/bundle.js').expect(200)
						.end(() => {
							startCmd.kill('SIGINT')
							done()
						})
				})
		})
	})

	it('reeasy dev should success', done => {
		let startCmd = child.spawn(path.join(__dirname, '../bin/reeasy.js'), ['dev', '-p', '3003'], {
			cwd: path.join(__dirname, 'test.builder.env1')
		})
		setTimeout(() => {
			request('http://localhost:3003')
				.get('/').expect(200).expect('Content-Type', 'text/html')
				.end(() => {
					request('http://localhost:3003')
						.get('/bundle.js').expect(200)
						.end(() => {
							startCmd.kill('SIGINT')
							done()
						})
				})
		}, 5000)
	})
})