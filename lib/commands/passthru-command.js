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

var commands = require( '../commands' );

/**
 * Constructor for PassthruCommand objects
 *
 * @param {String} name
 * @constructor
 */
function PassthruCommand( name, regex ) {
	this.name = name;
	this.cmdRegex = regex || new RegExp( this.name + '(\\s+(.*)?)?$' );
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
	var SELF = this;
	if ( deprecated ) {
		print.debug( 'Third argument is deprecated!' );
		rawArgs = deprecated;
	}
	rawArgs = this.adjustArgs( rawArgs );
	return new NPromise( function ( fulfill, reject ) {
		path = tryToGetPath( path );
		if ( !path ) {
			reject( 'No path provided!' );
			return;
		}
		var cmdArgs = {
				path   : path,
				rawArgs: rawArgs
			},
			connection = command( SELF.name, cmdArgs),
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
 * Attempt to get the server path from the current (local) path.
 *
 * @param {String} currentPath
 *
 * @returns {String}
 */
function tryToGetPath( currentPath ) {
	var vm = VM( process.cwd() );

	currentPath = currentPath || app.argv['project-path'];
	if ( !currentPath && 0 === process.cwd().indexOf( path.join( vm.root, 'projects' ) ) ) {
		currentPath = path.relative( path.join( vm.root, 'projects' ), process.cwd() );
	}

	if ( isAbsolute( currentPath ) ) {
		currentPath = path.relative( vm.root, currentPath );
	}
	return currentPath ? currentPath.replace( /\\+/g, '/' ) : '';
}

/**
 * Pass through our arguments.
 *
 * This is a placeholder function should we need to massage data in the future.
 *
 * @param {Array} args
 * @returns {Array}
 */
PassthruCommand.prototype.adjustArgs = function ( args ) {
	return args;
};

/**
 * Export the command primative.
 *
 * @type {PassthruCommand}
 */
module.exports = PassthruCommand;