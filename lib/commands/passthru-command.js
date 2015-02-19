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

function reconstructWpArgs( argv ) {
	"use strict";
	var x,
		wpArgs = '',
		dash = '';
	for ( x in argv ) {
		if ( argv.hasOwnProperty( x ) ) {
			switch ( x ) {
				case '_':
				case '$0':
					break;
				default:
					dash = x.length === 1 ? '-' : '--';
					wpArgs += dash + x;
					if ( true !== argv[x] ) {
						wpArgs += '=' + argv[x];
					}
					wpArgs += ' ';
					break;
			}
		}
	}
	wpArgs += argv._.slice( 1 ).join( ' ' );
	return wpArgs;
}

/**
 * Constructor for PassthruCommand objects
 *
 * @param {String} name
 * @constructor
 */
function PassthruCommand( name ) {
	"use strict";
	this.name = name;
	this.cmdRegex = new RegExp( this.name + '\\s*(.*)$' );
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
	this.command( app.argv.url, reconstructWpArgs( app.argv ) )
		.then( function () {
			print.info( 'All done!' );
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
 * @param {String} extraArgs
 * @returns {NPromise}
 */
PassthruCommand.prototype.command = function ( url, extraArgs ) {
	"use strict";
	var SELF = this;
	return new NPromise( function ( fulfill, reject ) {
		if ( !url ) {
			reject( 'No URL provided!' );
		}
		var cmdArgs = {
				url : url,
				args: extraArgs || ''
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

module.exports = PassthruCommand;
