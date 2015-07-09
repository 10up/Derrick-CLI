/*!
 * Derrick CLI
 *
 * 10up <sales@10up.com>
 * John Bloch <john.bloch@10up.com>
 * Eric Mann <eric.mann@10up.com>
 * Luke Woodward <luke.woodward@10up.com>
 * Taylor Lovett <taylor.lovett@10up.com>
 *
 * MIT License.
 */

'use strict';

/**
 * Module dependencies.
 */
var print = require( 'winston' ).cli(),
	command = require( '../command' ),
	NPromise = require( 'promise' ),
	VM = require( '../vm' ),
	path = require( 'path' ),
	isAbsolute = require( 'path-is-absolute' );

/**
 * The application.
 *
 * @type {Object}
 */
var app = require( '../app' );

/**
 * Constructor for PassthruCommand objects
 */
function PassthruCommand( name ) {
	this.name = name;
	this.project = null;
	this.cmdRegex = new RegExp( this.name + '.*' );

	app.cmd( this.cmdRegex, this.run.bind( this ) );
}

/**
 * Callback to use with the CLI app
 */
PassthruCommand.prototype.run = function() {
	this.parseDerrickArgs();

	return this.command()
		.then( function () {
			print.info( 'All done! Cleaning up a few things...' );
			command.closeConnections();
		}, function ( err ) {
			print.error( err );
			command.closeConnections();
			process.exit( 1 );
		} );
};

/**
 * Parse arguments needed for Derrick stripping them our for the server
 */
PassthruCommand.prototype.parseDerrickArgs = function() {
	if ( ! app.argv.project) {
		print.log( 'error', 'Missing required associated argument --project' );
		process.exit( 1 );
	} else {
		this.project = app.argv.project;
		delete app.argv.project;
	}
};

/**
 * Command to send the passthrough command to the server and set up listeners
 *
 * @param {String} path
 * @param {Array} rawArgs
 * @param {String} [deprecated]
 * @returns {NPromise}
 */
PassthruCommand.prototype.command = function() {
	var SELF = this;

	return new NPromise( function ( fulfill, reject ) {

		var args = SELF.formatArgs();
		if ( SELF.adjustArgs ) {
			args = SELF.adjustArgs( args );
		}

		var cmdArgs = {
				project: SELF.project,
				rawArgs: args
			},
			connection = command( SELF.name, cmdArgs ),
			output = '';

		connection.on( 'progress', function ( data ) {
			if ( undefined !== data.log ) {
				output += data.log[1];
				process.stdout.write( data.log[1] );
			}
		} );

		connection.on( 'error', function() {
			fulfill( output );
		} );

		connection.done( function() {
			fulfill( output );
		}, reject );
	} );
};

/**
 * Format cli args for the server
 */
PassthruCommand.prototype.formatArgs = function() {
	var args = [];

	if ( app.argv._ ) {
		args = args.concat( app.argv._.slice( 1 ) );
	}

	for ( var property in app.argv ) {
		if ( app.argv.hasOwnProperty( property ) ) {
			if ( '_' !== property && '$0' !== property ) {
				args.push( '--' + property + '=' + app.argv[property] );
			}
		}
	}

	return args;
};

/**
 * Commands can implement this method to easily achieve custom behavior
 */
PassthruCommand.prototype.adjustArgs = undefined;

/**
 * Export the command primative.
 *
 * @type {PassthruCommand}
 */
module.exports = PassthruCommand;