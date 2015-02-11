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
	NPromise = require( 'promise' ),
	Spinner = require( 'cli-spinner' ).Spinner,
	VM = require( '../vm' ),
	fs = require( 'fs' );

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
 * Attempt to connect to MySQL to export a database dumpfile.
 *
 * @param {String} db_name
 *
 * @returns {NPromise}
 */
function maybeDumpDatabase( db_name ) {
	"use strict";
	return new NPromise( function( fulfill, reject ) {

	} );
}

/**
 * Compress the freshly exported database file.
 *
 * @returns {NPromise}
 */
function compressDatabase() {
	"use strict";
	return new NPromise( function( fulfill, reject ) {

	} );
}

/**
 * Export a SQL database to a compressed file.
 *
 * @param {String} db_name
 */
module.exports = commands.export_db = function ( db_name ) {
	'use strict';
	var error = false;

	if ( undefined === db_name ) {
		print.error( 'You must define a database name!' );
		error = true;
	}

	if ( error ) {
		print.info( 'Aborting...' );
		process.exit( 1 );
		return;
	}

	print.log( 'info', 'Exporting dump file of \'%s\'', db_name );

	return maybeDumpDatabase( db_name )
		.then( compressDatabase );
};

/**
 * Route the command
 */
app.cmd( /export-db\s?([^\s]+)?/, function( db_name ) {
	"use strict";
	commands.export_db( db_name )
		.then( function() {
			print.info( 'All done!' );
			command.closeConnections();
		} );
} );