/*
 * Created on Fri Jun 30 2017
 *
 * Copyright (c) 2017 Loy B. <lonord@qq.com>
 */
module.exports = {
	getEntryDev: (rootPath, selector) => `
		import { AppContainer } from 'react-hot-loader'
		import React from 'react'
		import ReactDOM from 'react-dom'
		import App from '${rootPath}'

		const rootEl = ${selector}
		const render = Component =>
			ReactDOM.render(
				<AppContainer>
					<Component />
				</AppContainer>,
				rootEl
			);

		render(App)
		if (module.hot) module.hot.accept('${rootPath}', () => {
			const NextApp = require('${rootPath}').default
			render(NextApp)
		})
	`,

	getEntryProd: (rootPath, selector) => `
		import React from 'react'
		import ReactDOM from 'react-dom'
		import App from '${rootPath}'

		const rootEl = ${selector}
		ReactDOM.render(<App/>, rootEl)
	`
}