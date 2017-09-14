/**
 * @file Integration tests for lib/index.js
 */


const chai           = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chalk          = require('chalk');
const request        = require('supertest');
const sinon          = require('sinon');
const sinonChai      = require('sinon-chai');


chai.use(sinonChai);
chai.use(chaiAsPromised);
const should = chai.should();


const bluebird  = require('bluebird');
const express   = require('express');
const http      = require('http');
const https     = require('https');
const io        = require('socket.io');
const ioClient  = require('socket.io-client');
const Koa       = require('koa');
const pem       = require('pem');
const WebSocket = require('ws');


const createServer = require('../../lib/index.js');


describe('Integration tests: createServer', () => {
  describe('using `http`', () => {
    it('should be compatible with base HTTP module', (done) => {
      let server = createServer((req, res) => {
        res.end('HTTP: hello, world');
      });

      server.listen().then(() => {
        return request('http://localhost:3000').get('/').expect(200).then((response) => {
          response.text.should.equal('HTTP: hello, world');
          return server.close();
        });
      }).should.be.fulfilled.notify(done);
    });

    it('should be compatible with Bluebird', (done) => {
      let server = createServer((req, res) => {
        res.end('HTTP: hello, world');
      }, {
        Promise: bluebird
      });

      server.listen().then(() => {
        return request('http://localhost:3000').get('/').expect(200).then((response) => {
          response.text.should.equal('HTTP: hello, world');
          return server.close();
        });
      }).should.be.fulfilled.notify(done);
    });

    it('should be compatible with Express', (done) => {
      let app = express();

      app.get('/', (req, res) => {
        res.send('Express: hello, world');
      });

      let server = createServer(app);

      server.listen().then(() => {
        return request('http://localhost:3000').get('/').expect(200).then((response) => {
          response.text.should.equal('Express: hello, world');
          return server.close();
        });
      }).should.be.fulfilled.notify(done);
    });

    it('should be compatible with Koa', (done) => {
      let app = new Koa;

      app.use((ctx) => {
        ctx.body = 'Koa: hello, world';
      });

      let server = createServer(app.callback());

      server.listen().then(() => {
        return request('http://localhost:3000').get('/').expect(200).then((response) => {
          response.text.should.equal('Koa: hello, world');
          return server.close();
        });
      }).should.be.fulfilled.notify(done);
    });

    describe('`ws` module via `ws` protocol', () => {
      it('should be compatible with base HTTP module', (done) => {
        let server = createServer(() => {});

        let wss = new WebSocket.Server({ server: server.instance });

        wss.on('connection', (socket) => {
          socket.send('done');
        });

        server.listen().then(() => {
          return new Promise((resolve, reject) => {
            let ws = new WebSocket('ws://localhost:3000');

            ws.on('error', reject);
            ws.on('message', resolve);
          });
        }).then((message) => {
          message.should.equal('done');
          return server.close();
        }).should.be.fulfilled.notify(done);
      });

      it('should be compatible with Bluebird', (done) => {
        let server = createServer(() => {}, {
          Promise: bluebird
        });

        let wss = new WebSocket.Server({ server: server.instance });

        wss.on('connection', (socket) => {
          socket.send('done');
        });

        server.listen().then(() => {
          return new Promise((resolve, reject) => {
            let ws = new WebSocket('ws://localhost:3000');

            ws.on('error', reject);
            ws.on('message', resolve);
          });
        }).then((message) => {
          message.should.equal('done');
          return server.close();
        }).should.be.fulfilled.notify(done);
      });

      it('should be compatible with Express', (done) => {
        let app = express();

        let server = createServer(app);

        let wss = new WebSocket.Server({ server: server.instance });

        wss.on('connection', (socket) => {
          socket.send('done');
        });

        server.listen().then(() => {
          return new Promise((resolve, reject) => {
            let ws = new WebSocket('ws://localhost:3000');

            ws.on('error', reject);
            ws.on('message', resolve);
          });
        }).then((message) => {
          message.should.equal('done');
          return server.close();
        }).should.be.fulfilled.notify(done);
      });

      it('should be compatible with Koa', (done) => {
        let app = new Koa;

        let server = createServer(app.callback());

        let wss = new WebSocket.Server({ server: server.instance });

        wss.on('connection', (socket) => {
          socket.send('done');
        });

        server.listen().then(() => {
          return new Promise((resolve, reject) => {
            let ws = new WebSocket('ws://localhost:3000');

            ws.on('error', reject);
            ws.on('message', resolve);
          });
        }).then((message) => {
          message.should.equal('done');
          return server.close();
        }).should.be.fulfilled.notify(done);
      });
    });

    describe('`socket.io` module via `ws` protocol', () => {
      it('should be compatible with base HTTP module', (done) => {
        let server = createServer(() => {});

        let wss = io(server.instance);

        wss.on('connection', (socket) => {
          socket.emit('done', 'done');
        });

        server.listen().then(() => {
          return new Promise((resolve, reject) => {
            let ws = ioClient.connect('ws://localhost:3000');

            ws.on('error', reject);
            ws.on('done', resolve);
          });
        }).then((message) => {
          message.should.equal('done');
          return server.close();
        }).should.be.fulfilled.notify(done);
      });

      it('should be compatible with Bluebird', (done) => {
        let server = createServer(() => {}, {
          Promise: bluebird
        });

        let wss = io(server.instance);

        wss.on('connection', (socket) => {
          socket.emit('done');
        });

        server.listen().then(() => {
          return new Promise((resolve, reject) => {
            let ws = ioClient.connect('ws://localhost:3000');

            ws.on('error', reject);
            ws.on('done', resolve);
          });
        }).then((message) => {
          return server.close();
        }).should.be.fulfilled.notify(done);
      });

      it('should be compatible with Express', (done) => {
        let app = express();

        let server = createServer(app);

        let wss = io(server.instance);

        wss.on('connection', (socket) => {
          socket.emit('done', 'done');
        });

        server.listen().then(() => {
          return new Promise((resolve, reject) => {
            let ws = ioClient.connect('ws://localhost:3000');

            ws.on('error', reject);
            ws.on('done', resolve);
          });
        }).then((message) => {
          message.should.equal('done');
          return server.close();
        }).should.be.fulfilled.notify(done);
      });

      it('should be compatible with Koa', (done) => {
        let app = new Koa;

        let server = createServer(app.callback());

        let wss = io(server.instance);

        wss.on('connection', (socket) => {
          socket.emit('done', 'done');
        });

        server.listen().then(() => {
          return new Promise((resolve, reject) => {
            let ws = ioClient.connect('ws://localhost:3000');

            ws.on('error', reject);
            ws.on('done', resolve);
          });
        }).then((message) => {
          message.should.equal('done');
          return server.close();
        }).should.be.fulfilled.notify(done);
      });
    });
  });

  describe('using `https`', () => {
    let config = {
      ssl: {}
    };

    before(function(done) {
      // Disable timeout for creating self-signed certificates
      this.timeout(0);
      let hrstart = process.hrtime();

      process.stderr.write(chalk.dim.cyan('      i '));
      process.stderr.write(chalk.dim.gray('creating self-signed SSL certificates for testing...'));

      pem.createCertificate({ days: 1, selfSigned: true }, (error, keys) => {
        let hrend = process.hrtime(hrstart);
        let s = (hrend[0] + (hrend[1] / 1000000) / 1000).toFixed(3);

        if (error) {
          process.stderr.write(chalk.dim.red(` failed (${s}s)\n`));
          return done(error);
        }

        config.ssl.key  = keys.serviceKey;
        config.ssl.cert = keys.certificate;
        process.stderr.write(chalk.dim.green(` done (${s}s)\n`));
        done();
      });
    });

    it('should be compatible with base HTTPS module', (done) => {
      let server = createServer((req, res) => {
        res.end('HTTPS: hello, world');
      }, config);

      server.listen().then(() => {
        let agent = request.agent('https://localhost:3000');

        return agent.get('/').ca(config.ssl.cert).expect(200).then((response) => {
          response.text.should.equal('HTTPS: hello, world');
          return server.close();
        });
      }).should.be.fulfilled.notify(done);
    });

    it('should be compatible with Bluebird', (done) => {
      let server = createServer((req, res) => {
        res.end('HTTPS: hello, world');
      }, Object.assign({
        Promise: bluebird
      }, config));

      server.listen().then(() => {
        let agent = request.agent('https://localhost:3000');

        return agent.get('/').ca(config.ssl.cert).expect(200).then((response) => {
          response.text.should.equal('HTTPS: hello, world');
          return server.close();
        });
      }).should.be.fulfilled.notify(done);
    });

    it('should be compatible with Express', (done) => {
      let app = express();

      app.get('/', (req, res) => {
        res.send('Express: hello, world');
      });

      let server = createServer(app, config);

      server.listen().then(() => {
        let agent = request.agent('https://localhost:3000');

        return agent.get('/').ca(config.ssl.cert).expect(200).then((response) => {
          response.text.should.equal('Express: hello, world');
          return server.close();
        });
      }).should.be.fulfilled.notify(done);
    });

    it('should be compatible with Koa', (done) => {
      let app = new Koa;

      app.use((ctx) => {
        ctx.body = 'Koa: hello, world';
      });

      let server = createServer(app.callback(), config);

      server.listen().then(() => {
        let agent = request.agent('https://localhost:3000');

        return agent.get('/').ca(config.ssl.cert).expect(200).then((response) => {
          response.text.should.equal('Koa: hello, world');
          return server.close();
        });
      }).should.be.fulfilled.notify(done);
    });

    describe('`ws` module via `wss` protocol', () => {
      it('should be compatible with base HTTPS module', (done) => {
        let server = createServer(() => {}, config);

        let wss = new WebSocket.Server({ server: server.instance });

        wss.on('connection', (socket) => {
          socket.send('done');
        });

        server.listen().then(() => {
          return new Promise((resolve, reject) => {
            let ws = new WebSocket('wss://localhost:3000', {
              rejectUnauthorized: false
            });

            ws.on('error', (error) => {
              reject(error);
            });

            ws.on('message', (message) => {
              if (message === 'done') {
                resolve();
              }
            });
          });
        }).then(() => {
          return server.close();
        }).should.be.fulfilled.notify(done);
      });

      it('should be compatible with Bluebird', (done) => {
        let server = createServer(() => {}, Object.assign({
          Promise: bluebird
        }, config));

        let wss = new WebSocket.Server({ server: server.instance });

        wss.on('connection', (socket) => {
          socket.send('done');
        });

        server.listen().then(() => {
          return new Promise((resolve, reject) => {
            let ws = new WebSocket('wss://localhost:3000', {
              rejectUnauthorized: false
            });

            ws.on('error', (error) => {
              reject(error);
            });

            ws.on('message', (message) => {
              if (message === 'done') {
                resolve();
              }
            });
          });
        }).then(() => {
          return server.close();
        }).should.be.fulfilled.notify(done);
      });

      it('should be compatible with Express', (done) => {
        let app = express();

        let server = createServer(app, config);

        let wss = new WebSocket.Server({ server: server.instance });

        wss.on('connection', (socket) => {
          socket.send('done');
        });

        server.listen().then(() => {
          return new Promise((resolve, reject) => {
            let ws = new WebSocket('wss://localhost:3000', {
              rejectUnauthorized: false
            });

            ws.on('error', (error) => {
              reject(error);
            });

            ws.on('message', (message) => {
              if (message === 'done') {
                resolve();
              }
            });
          });
        }).then(() => {
          return server.close();
        }).should.be.fulfilled.notify(done);
      });

      it('should be compatible with Koa', (done) => {
        let app = new Koa;

        let server = createServer(app.callback(), config);

        let wss = new WebSocket.Server({ server: server.instance });

        wss.on('connection', (socket) => {
          socket.send('done');
        });

        server.listen().then(() => {
          return new Promise((resolve, reject) => {
            let ws = new WebSocket('wss://localhost:3000', {
              rejectUnauthorized: false
            });

            ws.on('error', (error) => {
              reject(error);
            });

            ws.on('message', (message) => {
              if (message === 'done') {
                resolve();
              }
            });
          });
        }).then(() => {
          return server.close();
        }).should.be.fulfilled.notify(done);
      });
    });

    describe('`socket.io` module via `wss` protocol', () => {
      it('should be compatible with base HTTPS module', (done) => {
        let server = createServer(() => {}, config);

        let wss = io(server.instance);

        wss.on('connection', (socket) => {
          socket.emit('done', 'done');
        });

        server.listen().then(() => {
          return new Promise((resolve, reject) => {
            let ws = ioClient.connect('wss://localhost:3000', {
              rejectUnauthorized: false
            });

            ws.on('error', reject);
            ws.on('done', resolve);
          });
        }).then((message) => {
          message.should.equal('done');
          return server.close();
        }).should.be.fulfilled.notify(done);
      });

      it('should be compatible with Bluebird', (done) => {
        let server = createServer(() => {}, Object.assign({
          Promise: bluebird
        }, config));

        let wss = io(server.instance);

        wss.on('connection', (socket) => {
          socket.emit('done');
        });

        server.listen().then(() => {
          return new Promise((resolve, reject) => {
            let ws = ioClient.connect('wss://localhost:3000', {
              rejectUnauthorized: false
            });

            ws.on('error', reject);
            ws.on('done', resolve);
          });
        }).then((message) => {
          return server.close();
        }).should.be.fulfilled.notify(done);
      });

      it('should be compatible with Express', (done) => {
        let app = express();

        let server = createServer(app, config);

        let wss = io(server.instance);

        wss.on('connection', (socket) => {
          socket.emit('done', 'done');
        });

        server.listen().then(() => {
          return new Promise((resolve, reject) => {
            let ws = ioClient.connect('wss://localhost:3000', {
              rejectUnauthorized: false
            });

            ws.on('error', reject);
            ws.on('done', resolve);
          });
        }).then((message) => {
          message.should.equal('done');
          return server.close();
        }).should.be.fulfilled.notify(done);
      });

      it('should be compatible with Koa', (done) => {
        let app = new Koa;

        let server = createServer(app.callback(), config);

        let wss = io(server.instance);

        wss.on('connection', (socket) => {
          socket.emit('done', 'done');
        });

        server.listen().then(() => {
          return new Promise((resolve, reject) => {
            let ws = ioClient.connect('wss://localhost:3000', {
              rejectUnauthorized: false
            });

            ws.on('error', reject);
            ws.on('done', resolve);
          });
        }).then((message) => {
          message.should.equal('done');
          return server.close();
        }).should.be.fulfilled.notify(done);
      });
    });
  });
});
