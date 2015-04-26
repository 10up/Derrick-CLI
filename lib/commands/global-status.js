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
 * Module dependencies
 */
var settings = require( '../settings' ),
	_ = require( 'lodash' ),
	Table = require( 'cli-table' );

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
 * Prints out information we know about all Derrick installations.
 *
 * @api public
 */
commands.globalstatus = function() {
	// First get the project for this VM.
	var vms = settings.get( 'vms' ) || [];

	// Generate the table
	var table = new Table({
		head: ['ID', 'Path', 'CLI Version' ],
		colWidths: [10, 40, 10],
		style: { head: ['cyan'] }
	});

	_.forEach( vms, function( value, key ) {
		table.push( [key, value.path, value.cli] );
	} );

	process.stdout.write( '\n' );
	process.stdout.write( table.toString() );
	process.stdout.write( '\n\n' );
	process.stdout.write( 'The above shows information about all known Derrick installations.\n' );
	process.stdout.write( 'For more specific information on any Derrick installations, run\n' );
	process.stdout.write( '"derrick status" from their own project directories.\n' );
	process.stdout.write( '\n' );
};

/**
 * Route the command
 */
app.cmd( /global-status/, commands.globalstatus );