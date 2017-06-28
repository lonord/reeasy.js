const webpack = require('webpack')

module.exports = {
	rootPath: './src/app.js',
	selector: '#root',
	webpack: (config, dev) => {
		if (dev) {
			config.plugins.push(new webpack.BannerPlugin({
				banner: 'hello'
			}))
		}
		else {
			config.plugins.push(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/))
		}
		return config
	},
	babelLoaderConfig: (babelConfig, dev) => {
		if (dev) {
			babelConfig.use.options.plugins.push('babel-plugin-my-dev')
		}
		else {
			babelConfig.use.options.plugins.push('babel-plugin-my-prod')
		}
		return babelConfig
	}
}