# Reeasy.js

[![version](https://img.shields.io/npm/v/reeasy.svg?style=flat-square)](https://www.npmjs.com/package/reeasy) [![build](https://img.shields.io/travis/lonord/reeasy.js.svg?style=flat-square)](https://travis-ci.org/lonord/reeasy.js) [![Coverage Status](https://coveralls.io/repos/github/lonord/reeasy.js/badge.svg?branch=master)](https://coveralls.io/github/lonord/reeasy.js?branch=master)

Framework of React app with easy configuration. Support HMR and custom server. As simple as next.js.

Mostly ES6/React feature has be built in Reeasy.js. If you need more, just [custom babel loader config](#custom-configuration).

## How to use

- [Setup](#setup)
- [Run in production mode](#run-in-production-mode)
- [Custom configuration](#custom-configuration)
- [Cli](#cli)
- [Custom server](#custom-server)

### Setup

Install it

	npm i reeasy --save

and add a script to your package.json like this:

```json
{
  "scripts": {
    "dev": "reeasy dev",
    "build": "reeasy build",
    "start": "reeasy start"
  }
}
```

create several necessary files:

`index.html`

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Welcome to reeasy.js!</title>
    <meta charset="UTF-8"/>
  </head>
  <body>
    <div id="root"></div>
    <script src="/bundle.js"></script>
  </body>
</html>
```

`app.js`

```js
import React from 'react'

export default () => (
  <div>Welcome to reeasy.js!</div>
)
```

`reeasy.config.js` - (reeasy config file)

```js
module.exports = {
  rootPath: './app.js',  //Entry file path of your app
  selector: '#root'      //Selector of element for rendering
}
```

finally run `npm run dev` and go to `http://localhost:3000`. To use another port, you can run `npm run dev -- -p <your port here>`.

### Run in production mode

Build it first

	npm run build

Start server

	npm start

Start server using **pm2**

	pm2 start npm -- start

### Custom configuration

Custom configuration is specified in `reeasy.config.js` in root directory of your project

```js
module.exports = {

  //Entry file path of your app, this field is required
  // rootPath: <your entry file path>,
  
  //Selector of element for rendering, default `div`
  //starting with `.` for class name (such as `.content`);
  //starting with `#` for id (such as `#root`);
  //otherwise for tag name (like `div`),
  selector: 'div',
  
  //Output directory for build, default `.dist`
  outDir: '.dist',

  //Output bundle name, default `bundle.js`  
  bundleName: 'bundle.js',

  //Public path for http server, default `/`  
  publicPath: '/',
  
  //Path of index html file, default `./index.html`
  indexHTML: 'index.html',
  
  //Custom webpack configuration
  webpack: (config, dev) => {
    //config: webpack configuration object
    //dev: boolean, is in development mode

    //your config here

    //return new config (important!)
    return config
  },

  //Custom babel-loader configuration  
  babelLoaderConfig: (config, dev) => {
    //config: babel-loader configuration
    //dev: boolean, is in development mode
    
    //your config here

    //return new config (important!)
    return config
  },

  ////Custom webpack-dev-middleware configuration  
  devMiddlewareConfig: (config) => {
    //config: webpack-dev-middleware configuration
    
    //your config here

    //return new config (important!)
    return config
  }
}
```

### Cli

Reeasy cli usage

- `reeasy dev` Run reeasy in development mode, with hot module replacement
- `reeasy build` Build app in production mode
- `reeasy start` Start in production mode, need run `reeasy build` first

options

- `-c, --config` Custom reeasy configuration file
- `-p, --port` Port to listen for http server
- `-w, --cwd` Custom working directory

### Custom server

First, add a `server.js` file in your project directory like this:

- **If you use `http` module directly**

```js
const http = require('http')
const reeasy = require('reeasy')

const app = reeasy({
  dev: process.env.NODE_ENV !== 'production'
})

app.prepare().then(middleware => {
  const server = http.createServer((req, res) => {
    middleware(req, res)
  })

  server.listen(3000, err => {
    if (err) throw err
    console.log('> Ready on http://localhost:3000')
  })
})
```

- **If you use express**

```js
const express = require('express')
const reeasy = require('reeasy')

const app = reeasy({
  dev: process.env.NODE_ENV !== 'production'
})

app.prepare().then(middleware => {
  const server = express()

  //define other middleware here

  server.use(middleware)

  server.listen(3000, err => {
    if (err) throw err
    console.log('> Ready on http://localhost:3000')
  })
})
```

- **If you use koa**

```js
const Koa = require('koa')
const reeasy = require('reeasy')

const app = reeasy({
  dev: process.env.NODE_ENV !== 'production'
})

app.prepare().then(middleware => {
  const server = new Koa()

  //define other middleware here

  server.use(middleware.koa())

  server.listen(3000, err => {
    if (err) throw err
    console.log('> Ready on http://localhost:3000')
  })
})
```

Then add a script to your package.json like this:

```json
{
  "scripts": {
    "dev": "NODE_ENV=development node server.js",
    "build": "reeasy build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

Finally start your project by npm scripts.

The `reeasy` API is:

- `reeasy(opts: object)` Create reeasy instance

Supported options:

- `cwd` (`string`) Current work directory, use `process.cwd()` as default
- `dev` (`bool`) Whether to launch reeasy in dev mode, default `false`
- `conf` (`string`) Custom reeasy configuration file path, if not set this option, use default configuration file path (`reeasy.config.js` in root directory)

## License

MIT