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
 * Export a SQL database to a compressed file.
 *
 * @param {String} db_name
 */
module.exports = commands.export_db = function ( db_name ) {

};

/**
 * Route the command
 */
app.cmd( /export-db\s?([^\s]+)?/, function( db_name ) {
	"use strict";
	commands.import_db( db_name )
		.then( function() {
			print.info( 'All done!' );
			command.closeConnections();
		} );
} );