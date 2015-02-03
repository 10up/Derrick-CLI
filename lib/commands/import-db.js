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
 * Import the specified SQL dump file into the named database.
 *
 * @param {String} db_name
 * @param {String} dump_file
 *
 * @returns {NPromise}
 */
function importDB( db_name, dump_file ) {
	"use strict";

	return new NPromise( function( fulfill, reject ) {
		var command_params = {
			"database": db_name,
			"dumpfile": dump_file
		};

		var com = command( 'import-db', command_params );

		com.on( 'progress', function( data ) {
			if ( undefined !== data.log ) {
				data.log[1] = 'Server - ' + data.log[1];
				print.log.apply( com, data.log );
			}

			// Clean up our events
			com.done( fulfill, reject );
		} );
	} );
}

/**
 * Imports a SQL file
 *
 * @param {String} db_name
 * @param {String} dump_file
 */
commands.import_db = function( db_name, dump_file ) {
	var error = false;

	if ( undefined === db_name ) {
		print.error( 'You must define a database name!' );
		error = true;
	}

	if ( undefined === dump_file ) {
		print.error( 'You must specify a dump file.' );
		error = true;
	}

	if ( error ) {
		print.info( 'Aborting...' );
		process.exit( 1 );
		return;
	}

	print.log( 'info', 'Importing SQL dump into \'%s\'', db_name );

	importDB( db_name, dump_file )
		.then( function() { print.info( 'All done!' ); } );
};

/**
 * Route the command
 */
app.cmd( /import-db\s?([^\s]+)?\s?([^\s]+)?/, commands.import_db );