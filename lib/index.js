const builder = require('./builder')

module.exports = function (opts) {
	const dev = opts.dev || false
	const conf = opts.conf
	return {
		prepare: () => {
			return builder.readConfig(conf).then(config => {
				if (dev) {
					return builder.prepareWebpack(config, true)
						.then(webpackConfig => builder.getDevMiddleware(webpackConfig, config))
				}
				else {
					return builder.getProdMiddleware(config)
				}
			})
		}
	}
}