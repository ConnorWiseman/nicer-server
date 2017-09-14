/**
 * @file Mocked objects for use in testing.
 */


const EventEmitter = require('events');


module.exports.Server = class MockedServer extends EventEmitter {
  constructor() {
    super();
    this.listening = false;
  }

  listen(port, cb) {
    this.listening = true;
    this.on('listening', cb);
    this.emit('listening');
  }

  close(cb) {
    this.listening = false;
    this.on('close', cb);
    this.emit('close');
  }
};


module.exports.Response = class MockedResponse extends EventEmitter {
  end() {}
  setHeader() {}
};


module.exports.Socket = class MockedSocket extends EventEmitter {
  constructor() {
    super();
    this._handle = {};
  }
  setTimeout() {}
  destroy() {}
};
