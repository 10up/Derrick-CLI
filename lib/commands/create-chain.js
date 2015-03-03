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
	cwd = process.cwd(),
	vm = require( '../vm' )( cwd ),
	fs = require( 'fs' ),
	path = require( 'path' );

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

function localPathToServerPath( local ) {
	"use strict";
	var rel = path.relative( vm.root, local );
	return rel.replace( /\\+/g, '/' );
}

function resolveProject( project, is_url ) {
	"use strict";
	return new NPromise( function ( fulfill, reject ) {
		if ( is_url ) {
			return fulfill( [project, is_url] );
		}
		if ( undefined === project ) {
			var searchPath = cwd;
			while ( true ) {
				if ( fs.existsSync( path.join( searchPath, 'manifest.lock' ) ) ) {
					return fulfill( [localPathToServerPath( path.join( searchPath, 'manifest.lock' ) ), false] );
				}
				if ( path.dirname( searchPath ) === searchPath || vm.root === searchPath ) {
					return reject( 'Could not find project manifest' );
				}
				searchPath = path.dirname( searchPath );
			}
		}
		if ( fs.existsSync( project ) ) {
			if ( 'manifest.lock' === path.basename( project ) ) {
				return fulfill( [localPathToServerPath( project ), false] );
			}
			if ( fs.existsSync( path.join( project, 'manifest.lock' ) ) ) {
				return fulfill( [localPathToServerPath( path.join( project, 'manifest.lock' ) ), false] );
			}
		}
		return reject( 'Could not find project manifest' );
	} );
}

function update_portmap( args ) {
	return new NPromise( function( fulfill, reject ) {
		if ( undefined === args.port ) {
			return reject();
		}

		var port = args.port;

		console.log( port );
		fulfill();
	} );
}

function send_command( args ) {
	"use strict";
	return new NPromise( function ( fulfill, reject ) {
		var cmd_args = {
				manifest: args[0],
				is_url  : !!args[1]
			},
			connection = command( 'create-chain', cmd_args );

		connection.on( 'progress', function ( data ) {
			if ( undefined !== data.log ) {
				data.log[1] = 'Server - ' + data.log[1];
				print.log.apply( connection, data.log );
			}

			if ( undefined !== data.port ) {
				cmd_args.port = data.port
			}
		} );

		connection.done( function() { return fulfill( cmd_args ); }, reject );
	} );
}

module.exports = commands.create_chain = function ( project ) {
	"use strict";
	return resolveProject( project )
		.then( send_command )
		.then( update_portmap );
};

app.cmd( /create-chain\s?((--url[=\s])?\S+)?/, function ( project, is_url ) {
	"use strict";
	commands.create_chain( project, is_url )
		.then( function () {
			print.info( 'All done! Cleaning up a few things...' );
			command.closeConnections();
		}, function ( err ) {
			print.error( err );
			print.info( 'All done! Cleaning up a few things...' );
			command.closeConnections();
			process.exit( 1 );
		} );
} );
