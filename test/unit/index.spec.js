/**
 * @file Unit tests for lib/index.js
 */


const chai           = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chalk          = require('chalk');
const proxyquire     = require('proxyquire').noPreserveCache();
const sinon          = require('sinon');
const sinonChai      = require('sinon-chai');


chai.use(sinonChai);
chai.use(chaiAsPromised);
const should = chai.should();


const mocks = require('./mocks.js');


const stubs = {
  http: {
    createServer: (cb) => {
      return new mocks.Server(cb);
    }
  },
  https: {
    createServer: (options, cb) => {
      return new mocks.Server(cb);
    }
  },
  uuid: {
    v4: () => 'uuid'
  }
};


const createServer = proxyquire('../../lib/index.js', stubs);


const config = {};


describe('Unit tests: createServer', () => {
  it('should export a function', () => {
    createServer.should.be.a('function');
  });

  it('should throw TypeError if first argument is not a function', () => {
    (() => {
      createServer('string', config);
    }).should.throw(TypeError);
  });

  it('should provide default values for `config`', () => {
    createServer(() => {}, config).config.should.have.all.keys('logger', 'port', 'Promise', 'ssl');
  });

  it('should create HTTP server via `http#createServer`', () => {
    sinon.spy(stubs.http, 'createServer');
    createServer(() => {}, config);
    stubs.http.createServer.should.have.been.calledOnce;
    stubs.http.createServer.restore();
  });


  it('should create HTTPS server via `https#createServer`', () => {
    sinon.spy(stubs.https, 'createServer');
    createServer(() => {}, { ssl: {} });
    stubs.https.createServer.should.have.been.calledOnce;
    stubs.https.createServer.restore();
  });

  it('should return an object', () => {
    createServer(() => {}, config).should.be.an('object');
  });

  it('should return an object with properties `close`, `config`, `instance`, `listen`, `restart`, and `sockets`', () => {
    createServer(() => {}, config).should.have.all.keys('close', 'config', 'instance', 'listen', 'restart', 'sockets');
  });

  it('should return an object with method `#close`', () => {
    createServer(() => {}, config).close.should.be.a('function');
  });

  it('should return an object with object property `config`', () => {
    createServer(() => {}, config).config.should.be.an('object');
  });

  it('should return an object with Server property `instance`', () => {
    // For this test the constructor is actually `MockedServer`, but it's six
    // of one, half a dozen of the other!
    let server = createServer(() => {}, config);

    server.instance.should.be.an('object');
    server.instance.constructor.name.should.equal('MockedServer');
  });

  it('should return an object with method `#listen`', () => {
    createServer(() => {}, config).listen.should.be.a('function');
  });

  it('should return an object with method `#restart`', () => {
    createServer(() => {}, config).restart.should.be.a('function');
  });

  it('should return an object with Map property `sockets`', () => {
    createServer(() => {}, config).sockets.constructor.name.should.equal('Map');
  });

  describe('#close', () => {
    let server;

    beforeEach(() => {
      server = createServer(() => {}, config);
    });

    it('should return a Promise', () => {
      server.close().should.be.a('Promise');
    });

    it('should resolve immediately if server is not listening', (done) => {
      server.instance.listening.should.be.false;
      server.close().should.be.fulfilled.notify(done);
    });

    it('should destroy any leftover sockets', (done) => {
      let destroy = sinon.stub();

      server.listen().then(() => {
        server.sockets.set('uuid', { destroy });
        sinon.spy(server.sockets, 'delete');
        return server.close();
      }).then(() => {
        destroy.should.have.been.calledOnce;
        destroy.should.have.been.calledBefore(server.sockets.delete);
        server.sockets.delete.should.have.been.calledOnce;
      }).should.be.fulfilled.notify(done);
    });

    it('should call the server `close` method', (done) => {
      sinon.spy(server, 'close');

      server.listen().then(() => {
        return server.close();
      }).then(() => {
        server.close.should.have.been.calledOnce;
      }).should.be.fulfilled.notify(done);
    });
  });

  describe('#listen', () => {
    let server;

    beforeEach(() => {
      server = createServer(() => {}, config);
    });

    afterEach((done) => {
      server.close().should.be.fulfilled.notify(done);
    });

    it('should return a Promise', () => {
      server.listen().should.be.a('Promise');
    });

    it('should resolve immediately if already listening', (done) => {
      server.instance.listening.should.be.false;
      server.listen().then(() => {
        server.instance.listening.should.be.true;
        return server.listen();
      }).should.be.fulfilled.notify(done);
    });

    it('should call server instance\'s `listen` method', (done) => {
      sinon.spy(server.instance, 'listen');

      server.listen().then(() => {
        server.instance.listen.should.have.been.calledOnce;
      }).should.be.fulfilled.notify(done);
    });

    describe('[server] on `request`', () => {
      let socket, response;

      beforeEach(() => {
        socket = new mocks.Socket;
        response = new mocks.Response;
      });

      it('should set `idle` flag on incoming socket to `false`', (done) => {
        server.listen().then(() => {
          server.instance.emit('request', { headers: {}, socket }, response);
          socket.idle.should.equal(false);
        }).should.be.fulfilled.notify(done);
      });

      describe('[response] on `close`', () => {
        it('should set `idle` flag on closing socket to `true`', (done) => {
          server.listen().then(() => {
            server.instance.emit('request', { headers: {}, socket }, response);
            response.emit('close');
            socket.idle.should.equal(true);
          }).should.be.fulfilled.notify(done);
        });

        it('should destroy the socket if the server is shutting/shut down', (done) => {
          server.listen().then(() => {
            server.instance.emit('request', { headers: {}, socket }, response);
            return server.close();
          }).then(() => {
            sinon.spy(socket, 'destroy');
            sinon.spy(server.sockets, 'delete');
            response.emit('close');
            socket.destroy.should.have.been.calledOnce;
            socket.destroy.should.have.been.calledBefore(server.sockets.delete);
            server.sockets.delete.should.have.been.calledOnce;
          }).should.be.fulfilled.notify(done);
        });
      });

      describe('[response] on `finish`', () => {
        it('should set `idle` flag on closing socket to `true`', (done) => {
          server.listen().then(() => {
            server.instance.emit('request', { headers: {}, socket }, response);
            response.emit('finish');
            socket.idle.should.equal(true);
          }).should.be.fulfilled.notify(done);
        });

        it('should destroy the socket if the server is shutting/shut down', (done) => {
          server.listen().then(() => {
            server.instance.emit('request', { headers: {}, socket }, response);
            return server.close();
          }).then(() => {
            sinon.spy(socket, 'destroy');
            sinon.spy(server.sockets, 'delete');
            response.emit('finish');
            socket.destroy.should.have.been.calledOnce;
            socket.destroy.should.have.been.calledBefore(server.sockets.delete);
            server.sockets.delete.should.have.been.calledOnce;
          }).should.be.fulfilled.notify(done);
        });
      });
    });

    describe('[server] on `connection`', () => {
      let socket;

      beforeEach(() => {
        socket = new mocks.Socket;
      });

      it('should set `idle` flag on each socket to `true`', (done) => {
        server.listen().then(() => {
          server.instance.emit('connection', socket);
          socket.idle.should.exist;
          socket.idle.should.equal(true);
        }).should.be.fulfilled.notify(done);
      });

      it('should set `uuid` on each socket', (done) => {
        server.listen().then(() => {
          sinon.spy(stubs.uuid, 'v4');
          server.instance.emit('connection', socket);
          stubs.uuid.v4.should.have.been.calledOnce;
          stubs.uuid.v4.restore();
          socket.uuid.should.exist;
          socket.uuid.should.be.a('string');
        }).should.be.fulfilled.notify(done);
      });

      it('should add the socket to the internal `sockets` map', (done) => {
        server.listen().then(() => {
          server.sockets.size.should.equal(0);
          server.instance.emit('connection', socket);
          server.sockets.size.should.equal(1);
          server.sockets.keys().next().value.should.equal(socket.uuid);
        }).should.be.fulfilled.notify(done);
      });

      describe('[socket] once `close`', () => {
        it('should remove the socket from the internal `sockets` map', (done) => {
          server.listen().then(() => {
            server.instance.emit('connection', socket);
            socket.emit('close');
            server.sockets.size.should.equal(0);
          }).should.be.fulfilled.notify(done);
        });
      });
    });
  });

  describe('#restart', () => {
    let server;

    beforeEach(() => {
      server = createServer(() => {}, config);
    });

    afterEach((done) => {
      server.close().should.be.fulfilled.notify(done);
    });

    it('should return a Promise', () => {
      server.restart().should.be.a('Promise');
    });

    it('should call `server#close`, then `server#listen`', (done) => {
      sinon.spy(server, 'close');
      sinon.spy(server, 'listen');

      server.restart().then(() => {
        server.close.should.have.been.calledOnce;
        server.close.should.have.been.calledBefore(server.listen);
        server.listen.should.have.been.calledOnce;
      }).should.be.fulfilled.notify(done);
    });
  });
});
