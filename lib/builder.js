const express = require('express')
const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const webpack = require('webpack')
const isFunction = require('lodash.isfunction')
const findIndex = require('lodash.findindex')
const devMiddleware = require("webpack-dev-middleware")
const hotMiddleware = require("webpack-hot-middleware")

const templateEntryProvider = require('./template-entry-provider')
const webpackConfigProvider = require('./webpack')

const CONFIG_FILE_NAME = 'reeasy.config.js'
const TMP_DIR = '.reeasy'
const DEFAULT_CONFIG = {
	/*rootPath: required*/
	/*webpack: function (config) -> newConfig*/
	/*babelLoaderConfig: function (config) -> newConfig*/
	outDir: '.dist',
	bundleName: 'bundle.js',
	publicPath: '/',
	indexHTML: 'index.html',
	selector: 'body'
}
const cwd = process.cwd()
const tmpdir = path.join(cwd, TMP_DIR)

const generateConfig = (configFile) => {
	return new Promise((resolve, reject) => {
		//read config file in cwd
		let config;
		try {
			config = Object.assign({}, DEFAULT_CONFIG, require(path.join(cwd, configFile || CONFIG_FILE_NAME)))
		}
		catch (e) {
			throw new Error('A config file `easy.config.js` in root directory of your project is required!')
		}
		if (!config.rootPath) {
			throw new Error('`rootPath` is required in config file!')
		}
		fs.stat(path.join(cwd, config.indexHTML), (err, stat) => {
			if (err) {
				throw new Error('File specified in `indexHTML` could not be found!')
			}
			resolve(config)
		})
	}).then(config => {
		//generate entry file
		return new Promise((resolve, reject) => {
			rimraf(tmpdir, err => {
				if (err) {
					throw new Error('Cannot access temp directory `' + TMP_DIR + '`')
				}
				mkdirp(tmpdir, err => {
					if (err) {
						throw new Error('Cannot access temp directory `' + TMP_DIR + '`')
					}
					const entryFilePath = path.join(tmpdir, `__entry.js`)
					const rootComponentPath = path.relative(tmpdir, path.join(cwd, config.rootPath))
					let selector = ''
					if (config.selector.indexOf('#') === 0) {
						selector = `document.getElementById('${config.selector.substr(1)}')`
					}
					else if (config.selector.indexOf('.') === 0) {
						selector = `document.getElementsByClassName('${config.selector.substr(1)}')[0]`
					}
					else {
						selector = `document.getElementsByTagName('${config.selector.substr(1)}')[0]`
					}
					resolve(config)
				})
			})
		})
	}).then(config => {
		//
	})
}


module.exports = {
	build: (configFile) => {
		//TODO
	},

	getMiddleware: (configFile) => {
		//TODO
	}
}