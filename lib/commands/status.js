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
	VM = require( '../vm' ),
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
 * Prints out information we know about regarding Derrick.
 *
 * @api public
 */
commands.status = function() {
	// First, ensure we're set up in the right directory.
	var vm;
	try {
		vm = new VM( process.cwd() );
	} catch( e ) {
		process.stderr.write( '\n' );
		process.stderr.write( 'This command must be run from the root of a Derrick installation!' );
		process.stderr.write( '\n' );
		return;
	}

	// Load all settings
	var vms = settings.get( 'vms' );

	// Find this VM in the settings
	var projects = false;
	_.forEach( vms, function( value, id ) {
		if ( value.path == process.cwd() ) {
			projects = value.projects;
			return;
		}
	} );

	if ( ! projects ) {
		process.stderr.write( '\n' );
		process.stderr.write( 'Derrick doesn\'t seem to know about any projects yet.' );
		process.stderr.write( '\n' );
		return;
	}

	// Generate the table
	var table = new Table({
			head: ['Project', 'Path', 'Hostname' ],
			colWidths: [12, 43, 15],
			style: { head: ['cyan'] }
		});

	_.forEach( projects, function( value, key ) {
		table.push( [key, value.path, value.hostname] );
	} );

	process.stdout.write( '\n' );
	process.stdout.write( table.toString() );
	process.stdout.write( '\n\n' );
	process.stdout.write( 'The above shows information about all projects in the current Derrick\n' );
	process.stdout.write( 'directory. To find information on any other Derrick installations, run\n' );
	process.stdout.write( '"derrick global-status" to locate them, then "derrick status" from\n' );
	process.stdout.write( 'their own project directories.\n' );
	process.stdout.write( '\n' );
};

/**
 * Route the command
 */
app.cmd( /status/, commands.status );