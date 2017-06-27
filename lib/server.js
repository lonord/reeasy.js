const express = require('express')
const http = require('http')

module.exports = {
	createServer: (middleWare) => {
		const app = express()
		let server = http.createServer(app)
		app.use(middleWare)
		return {
			getApp: () => app,
			listen: port => {
				return new Promise(resolve => {
					server.listen(port, err => {
						if (err) throw err
						resolve(app)
					})
				})
			},
			close: () => {
				server.close()
			}
		}
	}
}