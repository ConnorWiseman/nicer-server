/**
 * @file Exports a function for creating a nicer HTTP(S) server.
 */


const debug = require('debug');
const http  = require('http');
const https = require('https');
const uuid  = require('uuid');


/**
 * An object literal encompassing an HTTP(S) server created from a specified
 * callback function, a map of active Socket connections to the server, and
 * methods for starting, stopping, and restarting the base HTTP(S) server.
 * @typedef ServerObject
 * @type {Object}
 * @property {Function}                 close    - Closes the server
 * @property {Object}                   config   - Server configuration
 * @property {http.Server|https.Server} instance - The underlying server
 * @property {Function}                 listen   - Starts the server
 * @property {Function}                 restart  - Restarts the server
 * @property {Map.<String, Socket>}     sockets  - Maps UUIDs to Sockets
 */


/**
 * Creates an HTTP(S) server based on a specified callback function that will
 * gracefully terminate active connections when it closes. All methods return
 * Promises that resolve to the wrapper upon success.
 * @param  {Function} cb  The callback function to use
 * @param  {Object}   [c] Server configuration
 * @return {ServerObject}
 * @throws {TypeError}
 */
module.exports = function createServer(cb, c) {
  if (typeof cb !== 'function') {
    throw new TypeError('callback must be a function');
  }


  /**
   * Server configuration options.
   * @type {Object}
   * @property {String}   logger  -
   * @property {Number}   port    -
   * @property {Function} Promise -
   * @property {Object}   ssl     -
   * @private
   */
  const config = Object.assign({
    logger:  'server',
    port:    3000,
    Promise: Promise,
    ssl:     null
  }, c);


  /**
   * Internal debugging function.
   * @type {Function}
   * @private
   */
  const logger = debug(config.logger);


  /**
   * The underlying server. Will be created with the `https` module if the
   * configuration specifies SSL information, and with `http` otherwise.
   * @type {http.Server|https.Server}
   * @see {@link https://nodejs.org/api/http.html#http_class_http_server}
   * @see {@link https://nodejs.org/api/https.html#https_class_https_server}
   * @private
   */
  const instance = (config.ssl) ? https.createServer(config.ssl, cb) : http.createServer(cb);


  /**
   * A map of active Socket connections.
   * @type {Map.<String, Socket>}
   * @see {@link https://nodejs.org/api/http.html#http_message_socket}
   * @private
   */
  const sockets = new Map;


  /**
   * The above properties and below functions aggregated into a single object.
   * All Promises returned by the functions resolve to this; all internal
   * references to any of the properties or functions must use the
   * fully-qualified identifier name, i.e., `server.config.port`.
   * @type {ServerObject}
   * @public
   */
  const server = { close, config, instance, listen, restart, sockets };


  /**
   * Destroys remaining sockets to terminate active connections, then closes
   * the underlying HTTP(S) server.
   * @return {Promise.<ServerObject>}
   * @private
   */
  function close() {
    return new config.Promise((resolve) => {
      if (!server.instance.listening) {
        logger('already closed');
        resolve(server);
      } else {
        logger('closing');
        logger('destroying leftover sockets');
        server.sockets.forEach((socket, uuid) => {
          socket.destroy();
          server.sockets.delete(uuid);
        });

        server.instance.close(() => {
          logger('closed');
          resolve(server);
        });
      }
    });
  };


  /**
   * Creates a new HTTP(S) server, adding event handlers to the `request` and
   * `connection` events to toggle an `idle` flag on incoming Sockets and
   * destroy them if necessary. Resolves once the server is listening.
   * @return {Promise.<ServerObject>}
   * @private
   */
  function listen() {
    return new config.Promise((resolve) => {
      if (server.instance.listening) {
        logger('already listening');
        resolve(server);
      } else {
        logger('creating server instance');

        server.instance.on('request', (request, response) => {
          request.server = server;

          request.socket.idle = false;

          [ 'close', 'finish' ].forEach((e) => {
            response.once(e, () => {
              request.socket.idle = true;

              if (!server.instance.listening) {
                request.socket.destroy();
                server.sockets.delete(request.socket.uuid);
              }
            });
          });
        });

        server.instance.on('connection', (socket) => {
          socket.idle = true;
          socket.uuid = uuid.v4();

          server.sockets.set(socket.uuid, socket);

          socket.once('close', () => {
            server.sockets.delete(socket.uuid);
          });
        });

        server.instance.listen(server.config.port, () => {
          logger(`listening on port ${server.config.port}`);
          resolve(server);
        });
      }
    });
  };


  /**
   * Restarts the server.
   * @return {Promise.<ServerObject>}
   * @private
   */
  function restart() {
    logger('restarting server');
    return server.close().then(server.listen());
  };

  return server;
};
