/*!
 * Derrick CLI
 *
 * 10up <sales@10up.com>
 * John Bloch <john.bloch@10up.com>
 * Eric Mann <eric.mann@10up.com>
 * Luke Woodward <luke.woodward@10up.com>
 *
 * MIT License.
 */

/**
 * Module dependencies.
 */
var io = require( 'socket.io-client' ),
	NPromise = require( 'promise' ),
	deferred = require( 'deferred' ),
	print = require( 'winston' ).cli(),
	url = require( 'url' );

/**
 * Enable caching our established socket connections.
 *
 * @type {Object}
 */
var sockets = {};

/**
 * Connect to a socket on a specific port.
 *
 * @param {Number=} port
 * @returns {NPromise}
 */
function connect( port ) {
	"use strict";
	return new NPromise( function ( fulfill, reject ) {
		if ( undefined === port ) {
			port = 239;
		}

		var location = url.format( {
			protocol: 'http',
			hostname: 'derrick.dev',
			port    : port
		} );

		var socket = (sockets[location] && !sockets[location].active) ? sockets[location].sock : undefined;

		if ( socket && socket.connected ) {
			fulfill( socket );
			return;
		}

		var options = {
			timeout               : 10000,
			reconnectionAttempts  : 1,
			'force new connection': true
		};

		var locationUrl = location;
		if ( sockets[location] && sockets[location].active ) {
			var counter = 2,
				originalLocation = location;
			while ( sockets[location] && sockets[location].active ) {
				location = originalLocation + '-' + counter;
				if ( sockets[location] && !sockets[location].active ) {
					fulfill( sockets[location].sock );
					return;
				}
				counter += 1;
			}
		}

		sockets[location] = {
			sock      : io( locationUrl, options ),
			location  : location,
			connecting: true,
			active    : true
		};

		socket = sockets[location].sock;

		socket.on( 'connect', function () {
			sockets[location].connecting = false;
			print.log( 'info', 'Connected to server on port %d', port );
			fulfill( socket );
		} );

		socket.on( 'error', function ( er ) {
			sockets[location].connecting = false;
			reject( er );
		} );

		socket.on( 'connect_timeout', function ( er ) {
			sockets[location].connecting = false;
			reject( er );
		} );

		socket.on( 'connect_error', function ( er ) {
			sockets[location].connecting = false;
			reject( er );
		} );
	} );
}

function getSocketInfo( sock ) {
	"use strict";
	var location;
	for ( location in sockets ) {
		if ( sockets.hasOwnProperty( location ) ) {
			if ( sockets[location].sock === sock ) {
				return sockets[location];
			}
		}
	}
	return false;
}

/**
 * Create a timeout that kills the specified connection after 10,000ms.
 *
 * @param {Socket} connection
 * @param {Deferred} deferred
 *
 * @returns {number}
 */
function createThrottle( connection, deferred ) {
	"use strict";
	return setTimeout( function () {
		if ( getSocketInfo( connection ) ) {
			getSocketInfo( connection ).active = false;
		}
		connection.send( '41' );
		connection.close();
		deferred.reject( 'Socket timeout' );
		print.error( 'Socket timeout' );
	}, 10000 );
}

/**
 * Send a command to the server.
 *
 * @param {String} command
 * @param {Object} data
 *
 * @returns {Deferred.promise}
 */
function sendCommand( command, data ) {
	"use strict";
	var def = deferred();

	// Get a connection to the server.
	var socket = connect();

	// Send the command.
	var full_command = {
		"command": command,
		"params" : data
	};

	socket.catch( function () {
		print.log( 'error', 'Could not connect to VM. Maybe you need to start Vagrant? Try `vagrant up`.', command );
		process.exit( 1 );
	} );

	socket.done( function ( conn ) {
		print.log( 'info', 'Dispatching the %s command', command );

		var socketInfo = getSocketInfo( conn );
		if ( socketInfo ) {
			socketInfo.active = true;
		}

		var throttle = createThrottle( conn, def );

		var listeners = {};

		listeners.progress = function ( data ) {
			// Clear the timeout so we don't kill progress.
			clearTimeout( throttle );

			// Send a progress notification to any listeners.
			def.promise.emit( 'progress', data );

			// Reinitialize a timeout in case of errors.
			throttle = createThrottle( conn, def );
		};

		listeners.error = function ( er ) {
			clearTimeout( throttle );
			print.error( 'Connection failed' );

			def.reject( er );

			conn.removeListener( 'success', listeners.success );
			conn.removeListener( 'progress', listeners.progress );
			conn.removeListener( 'error', listeners.error );

			socketInfo.active = false;
		};

		listeners.success = function ( data ) {
			clearTimeout( throttle );
			print.info( 'Connection closed' );

			def.resolve( data );

			conn.removeListener( 'success', listeners.success );
			conn.removeListener( 'progress', listeners.progress );
			conn.removeListener( 'error', listeners.error );

			socketInfo.active = false;
		};

		conn.on( 'success', listeners.success );

		conn.on( 'progress', listeners.progress );

		conn.on( 'error', listeners.error );

		conn.emit( 'imbibe', full_command );
	} );

	return def.promise;
}

/**
 * Sexport the command.
 */
module.exports = sendCommand;

/**
 * Make sure we have the capability to close out any latent connections.
 */
module.exports.closeConnections = function () {
	"use strict";
	var location;
	for ( location in sockets ) {
		if ( sockets.hasOwnProperty( location ) ) {
			sockets[location].sock.send( '41' );
			sockets[location].sock.close();
		}
	}
};
