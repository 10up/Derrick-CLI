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
 */
function createDB( database, user, password ) {
	"use strict";

	return new NPromise( function( fulfill, reject ) {
		var command_params = {
			"database": database,
			"username": user,
			"password": password
		};

		command( 'create-db', command_params ).done( fulfill, reject );
	} );
}

/**
 * Prints the current version.
 *
 * @api public
 */
commands.create_db = function( db_name, username, password ) {
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
	}

	print.log( 'info', 'Creating database: %s', db_name );

	createDB( db_name, username, password )
		.then( function() { print.info( 'All done!' ); } );
};

/**
 * Route the command
 */
app.cmd( /create-db\s?([^\s]+)?\s?([^\s]+)?\s?([^\s]+)?/, commands.create_db );