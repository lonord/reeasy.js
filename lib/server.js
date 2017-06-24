const express = require('express')

module.exports = {
	createServer: (middleWare, port) => {
		return new Promise(resolve => {
			const app = express()
			app.use(middleWare)
			app.listen(port, err => {
				if (err) {
					throw err
				}
				resolve()
			})
		})
	}
}