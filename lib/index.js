/*
 * Created on Fri Jun 30 2017
 *
 * Copyright (c) 2017 Loy B. <lonord@qq.com>
 */
const builder = require('./builder')

module.exports = function (opts) {
	const cwd = opts.cwd || process.cwd()
	const dev = opts.dev || false
	const conf = opts.conf
	return {
		prepare: () => {
			return builder.readConfig(conf, cwd).then(config => {
				if (dev) {
					return builder.prepareWebpack(config, true, cwd)
						.then(webpackConfig => builder.getDevMiddleware(webpackConfig, config, cwd))
				}
				else {
					return builder.getProdMiddleware(config, cwd)
				}
			})
		}
	}
}