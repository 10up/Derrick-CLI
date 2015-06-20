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

'use strict';

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
 * Object wrapper
 *
 * @constructor
 */
function Command_CreateDB() {}

/**
 * Parse input from the CLI and run the import.
 *
 * @param {String} db_name
 * @param {String} username
 * @param {String} password
 *
 * @returns {NPromise}
 */
Command_CreateDB.prototype.run = function( db_name, username, password ) {
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

	return this.createDatabase( db_name, username, password );
};

/**
 * Run a command against the server API.
 *
 * @param {String} database
 * @param {String} user
 * @param {String} password
 *
 * @returns {NPromise}
 */
Command_CreateDB.prototype.createDatabase = function( database, user, password ) {
	return new NPromise( function ( fulfill, reject ) {
		// Truncate the database name - https://github.com/10up/Derrick/issues/28
		if ( database.length > 16 ) {
			database = database.substr( 0, 16 );
		}

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
};

/**
 * Creates a database and user account.
 *
 * @api public
 */
module.exports = Command_CreateDB;

/**
 * Route the command
 */
app.cmd( /create-db\s?([^\s]+)?\s?([^\s]+)?\s?([^\s]+)?/, function ( db_name, username, password ) {
	( new Command_CreateDB() ).run( db_name, username, password )
		.then( function () {
			print.info( 'All done! Cleaning up a few things...' );
			command.closeConnections();
		} );
} );
