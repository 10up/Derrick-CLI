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
var print = require( 'winston' ).cli(),
	command = require( '../command' ),
	NPromise = require( 'promise' );

/**
 * Commands
 *
 * @type {Object}
 */
var commands = require( '../commands' );

/**
 * The application.
 *
 * @type {Object}
 */
var app = require( '../app' );

/**
 * Run a command against the server API.
 *
 * @param {String} database
 * @param {String} user
 * @param {String} password
 *
 * @returns {NPromise}
 */
function createDB( database, user, password ) {
	"use strict";

	return new NPromise( function ( fulfill, reject ) {
		var command_params = {
			"database": database,
			"username": user,
			"password": password
		};

		var com = command( 'create-db', command_params );

		com.on( 'progress', function ( data ) {
			if ( undefined !== data.log ) {
				data.log[1] = 'Server - ' + data.log[1];
				print.log.apply( com, data.log );
			}
		} );

		// Clean up our events
		com.done( fulfill, reject );
	} );
}

/**
 * Creates a database and user account.
 *
 * @api public
 */
module.exports = commands.create_db = function ( db_name, username, password ) {
	"use strict";
	var error = false;

	if ( undefined === db_name ) {
		print.error( 'You must define a database name!' );
		error = true;
	}

	if ( undefined === username ) {
		print.error( 'You must define a database username!' );
		error = true;
	}

	if ( undefined === password ) {
		print.error( 'You must define a database password!' );
		error = true;
	}

	if ( error ) {
		print.info( 'Aborting...' );
		process.exit( 1 );
		return;
	}

	print.log( 'info', 'Creating database: %s', db_name );

	return createDB( db_name, username, password );
};

/**
 * Route the command
 */
app.cmd( /create-db\s?([^\s]+)?\s?([^\s]+)?\s?([^\s]+)?/, function ( db_name, username, password ) {
	"use strict";
	commands.create_db( db_name, username, password )
		.then( function () {
			print.info( 'All done! Cleaning up a few things...' );
			command.closeConnections();
		} );
} );
