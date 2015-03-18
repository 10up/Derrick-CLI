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
 * The application.
 *
 * @type {Object}
 */
var app = require( '../app' );

var commands = require( '../commands' );

/**
 * Constructor for PassthruCommand objects
 *
 * @param {String} name
 * @constructor
 */
function PassthruCommand( name, regex ) {
	"use strict";
	this.name = name;
	this.cmdRegex = regex || new RegExp( this.name + '\\s*(.*)$' );
	app.cmd( this.cmdRegex, this.cliCommand.bind( this ) );
	commands[this.name] = this.command.bind( this );
}

// Set up the prototype for the class

/**
 * Object's name
 *
 * @type {string}
 */
PassthruCommand.prototype.name = undefined;

/**
 * Regex to use with the command
 *
 * @type {RegExp}
 */
PassthruCommand.prototype.cmdRegex = undefined;

/**
 * Callback to use with the CLI app
 */
PassthruCommand.prototype.cliCommand = function () {
	"use strict";
	var args = process.argv.slice( 3 );
	this.command( app.argv.url, args.join( ' ' ), args )
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
 * Command to send the passthrough command to the server and set up listeners
 *
 * @param {String} url
 * @param {Array} rawArgs
 * @param {String} deprecated
 * @returns {NPromise}
 */
PassthruCommand.prototype.command = function ( path, rawArgs, deprecated ) {
	"use strict";
	var SELF = this;
	if ( deprecated ) {
		print.debug( 'Third argument is deprecated!' );
		rawArgs = deprecated;
	}
	rawArgs = this.adjustArgs( rawArgs );
	return new NPromise( function ( fulfill, reject ) {
		if ( ! path ) {
			reject( 'No path provided!' );
		}
		var cmdArgs = {
				path   : path,
				rawArgs: rawArgs
			},
			connection = command( SELF.name, cmdArgs );
		connection.on( 'progress', function ( data ) {
			if ( undefined !== data.log ) {
				data.log[1] = 'Server - ' + data.log[1];
				print.log.apply( connection, data.log );
			}
		} );
		connection.done( fulfill, reject );
	} );
};

PassthruCommand.prototype.adjustArgs = function ( args ) {
	"use strict";
	return args;
};

module.exports = PassthruCommand;
