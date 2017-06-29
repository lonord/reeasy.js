const webpack = require('webpack')

module.exports = {
	rootPath: './src/app.js',
	selector: '#root',
	publicPath: '/my',
	webpack: config => {

		config.module.loaders.push({
            test: /\.png$/,
            loader: 'file-loader?publicPath=/my/&name=[name].[ext]'
        })

		return config
	}
}