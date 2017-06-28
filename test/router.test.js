const assert = require('assert')
const routerCreate = require('../lib/router')

describe('test router.js', () => {

	let router

	beforeEach(() => {
		router = routerCreate()
	})

	it('normal router', (done) => {
		let o = []
		router.use((req, res, next) => {
			o.push('codeReachPoint1')
			next()
		})
		router.use((req, res, next) => {
			o.push('codeReachPoint2')
			next()
		})
		router.use((req, res, next) => {
			o.push('codeReachPoint3')
			next()
		})
		setTimeout(() => {
			router('req', 'res', () => {
				assert.equal(o.length, 3)
				assert.equal(o[0], 'codeReachPoint1')
				assert.equal(o[1], 'codeReachPoint2')
				assert.equal(o[2], 'codeReachPoint3')
				done()
			})
		}, 10)
	})

	it('router with passing err to next()', (done) => {
		let o = []
		router.use((req, res, next) => {
			o.push('codeReachPoint1')
			next()
		})
		router.use((req, res, next) => {
			o.push('codeReachPoint2')
			next(new Error())
		})
		router.use((req, res, next) => {
			o.push('codeReachPoint3')
			next()
		})
		setTimeout(() => {
			router('req', 'res', () => {
				assert.equal(o.length, 2)
				assert.equal(o[0], 'codeReachPoint1')
				assert.equal(o[1], 'codeReachPoint2')
				done()
			})
		}, 10)
	})

	it('router with no delivering', (done) => {
		let o = []
		router.use((req, res, next) => {
			o.push('codeReachPoint1')
		})
		router.use((req, res, next) => {
			o.push('codeReachPoint2')
			next()
		})
		router('req', 'res', () => {
			assert.fail('code should NOT reach here')
		})
		setTimeout(() => {
			assert.equal(o.length, 1)
			assert.equal(o[0], 'codeReachPoint1')
			done()
		}, 10)
	})

})