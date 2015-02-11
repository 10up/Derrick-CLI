/*!
 * Moonshine CLI
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
			hostname: 'moonshine.dev',
			port    : port
		} );

		var socket = sockets[location] ? sockets[location].sock : undefined;

		var connecting = sockets[location] ? sockets[location].connecting : undefined;

		if ( socket && (socket.connected || connecting) ) {
			fulfill( socket );
		}

		sockets[location] = {
			sock      : io( location ),
			connecting: true
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
	} );
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

	socket.done( function ( conn ) {
		print.log( 'info', 'Dispatching the %s command', command );

		var throttle = createThrottle( conn, def );

		conn.on( 'success', function ( data ) {
			clearTimeout( throttle );
			print.info( 'Connection closed' );

			def.resolve( data );
		} );

		conn.on( 'progress', function ( data ) {
			// Clear the timeout so we don't kill progress.
			clearTimeout( throttle );

			// Send a progress notification to any listeners.
			def.promise.emit( 'progress', data );

			// Reinitialize a timeout in case of errors.
			throttle = createThrottle( conn, def );
		} );

		conn.on( 'error', function ( er ) {
			clearTimeout( throttle );
			print.error( 'Connection failed' );

			def.reject( er );
		} );

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
			sockets[ location ].sock.close();
		}
	}
};
