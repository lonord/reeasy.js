/*
 * Created on Fri Jun 30 2017
 *
 * Copyright (c) 2017 Loy B. <lonord@qq.com>
 */
const path = require('path')
const finalhandler = require('finalhandler')
const isFunction = require('lodash.isfunction')
const UrlPattern = require('url-pattern')

const reduce = (rHandlers, index, req, res, callback) => {
	let thisHandler = rHandlers[index]
	let fn = err => {
		if (err || !thisHandler) {
			callback(err)
			return
		}
		thisHandler.call(null, req, res, reduce(rHandlers, index + 1, req, res, callback))
	}
	return fn
}

module.exports = function () {
	const o = {}
	function router(req, res, next) {
		let rHandlers = o._handlers || []
		reduce(rHandlers, 0, req, res, err => {
			let done = finalhandler(req, res)
			isFunction(next) ? next(err) : done(err)
		})()
	}
	router.use = function (match, fn) {
		if (!fn) {
			fn = match
		}
		else {
			fn._match = match
		}
		if (!o._handlers) {
			o._handlers = []
		}
		o._handlers.push(fn)
	}

	return router
}