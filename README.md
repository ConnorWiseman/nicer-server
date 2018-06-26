# nicer-server

[![npm](https://img.shields.io/npm/v/nicer-server.svg?style=flat-square)](https://www.npmjs.com/package/nicer-server)
![Node.js](https://img.shields.io/badge/node.js-%3E=_7.6.0-blue.svg?style=flat-square)
[![Build Status](https://img.shields.io/travis/ConnorWiseman/nicer-server/master.svg?style=flat-square)](https://travis-ci.org/ConnorWiseman/nicer-server) [![Coverage](https://img.shields.io/codecov/c/github/ConnorWiseman/nicer-server.svg?style=flat-square)](https://codecov.io/gh/ConnorWiseman/nicer-server)
[![Dependencies Status](https://david-dm.org/ConnorWiseman/nicer-server/status.svg?style=flat-square)](https://david-dm.org/ConnorWiseman/nicer-server)
[![devDependencies Status](https://david-dm.org/ConnorWiseman/nicer-server/dev-status.svg?style=flat-square)](https://david-dm.org/ConnorWiseman/nicer-server?type=dev)
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/ConnorWiseman/nicer-server/blob/master/LICENSE)

> A nicer HTTP(S) server.

Creates and manages an HTTP(S) server based on a specified callback function, maintaining a Map of active Socket connections to gracefully terminate them when the server closes. All methods return Promises.

Thoroughly tested with the built-in [`http@0.0.0`](https://nodejs.org/api/http.html) and [`https@1.0.0`](https://nodejs.org/api/https.html) modules, and compatible with the [`bluebird@3.5.1`](https://github.com/petkaantonov/bluebird/), [`express@4.16.3`](https://github.com/expressjs/express), [`koa@2.5.1`](https://github.com/koajs/koa), [`ws@5.2.1`](https://github.com/websockets/ws), and [`socket.io@2.1.1`](https://github.com/socketio/socket.io) modules.


## Installation
```shell
npm install --save nicer-server
```

## Usage

### Basic HTTP server

```javascript
const server = require('nicer-server');

let options = {
  port: 3000
};

server((req, res) => {
  res.end('Hello, world!');
}, options).listen();
```


### Koa

```javascript
const Koa    = require('koa');
const server = require('nicer-server');

let options = {
  port: 3000
};

let app = new Koa;

app.use(async (ctx) => {
  ctx.body = 'Hello, world!';
});

server(app.callback(), options).listen();
```


### Express

```javascript
const express = require('express');
const server  = require('nicer-server');

let options = {
  port: 3000
};

let app = express();

app.get('/', (req, res) => {
  res.end('Hello, world!');
});

server(app, options).listen();
```


## API

### #close

Destroys remaining sockets to terminate active connections, then closes the underlying HTTP(S) server.


### #listen

Creates a new HTTP(S) server, adding event handlers to the `request` and `connection` events to toggle an `idle` flag on incoming Sockets and destroy them if necessary. Resolves once the server is listening.


### #restart

Restarts the server. Calls `#close`, then `#listen`.


## Options

```javascript
const bluebird = require('bluebird');
const fs       = require('fs');

// Options for an HTTPS server listening on port 443,
// using the Bluebird Promise library
let options = {
  logger:  'https',
  port:    443,
  Promise: bluebird,
  ssl: {
    key:  fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
  }
};
```


### logger
`nicer-server` relies on the [`debug`](https://github.com/visionmedia/debug) module for debugging messages. The name of the logger used by this module may be customized by specifying an optional string. Defaults to `server`.


### port
The port to listen on. Defaults to `3000`.


### Promise
The constructor function to create internal Promises from. Defaults to the built-in `Promise` object.


### ssl
An object of SSL options. Defaults to `null`. If `null`, the underlying server instance will be created using `http#createServer`. See [the HTTPS Node.js documentation](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener) for more information.
