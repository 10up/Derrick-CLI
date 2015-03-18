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
	vm = require( '../vm' )( process.cwd() ),
	path = require( 'path' ),
	isAbsolute = require( 'path-is-absolute' );

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
	this.command( tryToGetPath(), args )
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
 * @param {String} path
 * @param {Array} rawArgs
 * @param {String} [deprecated]
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
		if ( !path ) {
			if ( !(path = tryToGetPath()) ) {
				reject( 'No path provided!' );
				return;
			}
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

function tryToGetPath() {
	"use strict";
	var currentPath = app.argv.path;
	if ( !currentPath && 0 === process.cwd().indexOf( path.join( vm.root, 'projects' ) ) ) {
		currentPath = path.relative( path.join( vm.root, 'projects' ), process.cwd() );
	}
	if ( isAbsolute( currentPath ) ) {
		currentPath = path.relative( vm.root, currentPath );
	}
	return currentPath.replace( /\\+/g, '/' );
}

PassthruCommand.prototype.adjustArgs = function ( args ) {
	"use strict";
	return args;
};

module.exports = PassthruCommand;
