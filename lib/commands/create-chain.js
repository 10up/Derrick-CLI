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
	cwd = process.cwd(),
	VM = require( '../vm' ),
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

/**
 * Get a server-side path from the local installation.
 *
 * @param {String} local
 *
 * @returns {String}
 */
function localPathToServerPath( local ) {
	var vm = VM( cwd ),
		rel = path.relative( vm.root, local );

	return rel.replace( /\\+/g, '/' );
}

/**
 * Get a handle on the project itself.
 *
 * @param {String} project
 * @param {Boolean} is_url
 *
 * @returns {NPromise}
 */
function resolveProject( project, is_url ) {
	var vm = VM( cwd );

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

/**
 * Get the system port mapping file and add our new domain to the list.
 *
 * @param {Object} args
 *
 * @returns {NPromise}
 */
function update_portmap( args ) {
	var vm = VM( cwd );

	return new NPromise( function( fulfill, reject ) {
		if ( undefined === args.port ) {
			return reject();
		}

		var manifest = args.manifest,
			port = args.port,
			portMapFile = path.join( vm.root, 'sys', 'portmap.json' );

		print.info( 'Updating port mappings...' );

		/**
		 * Read in the existing file contents.
		 *
		 * @param {String} file
		 *
		 * @returns {NPromise}
		 */
		function readPortMapFile( file ) {
			return new NPromise( function ( fulfill, reject ) {
				// flag to open the file is a+ because r+ still throws an exception if file doesn't exist
				fs.readFile( file, {encoding: 'utf8', flag: 'a+'}, function ( err, data ) {
					if ( err ) {
						reject( err );
					}
					fulfill( data );
				} );
			} );
		}

		/**
		 * Make sure we have a JSON object, either from the file or fresh.
		 *
		 * @param {String} fileContents
		 *
		 * @returns {NPromise}
		 */
		function parsePortMapJSON( fileContents ) {
			return new NPromise( function ( fulfill, reject ) {
				var portMap;
				try {
					portMap = JSON.parse( fileContents );
				} catch ( e ) {
					if ( '' !== fileContents ) {
						return reject( e );
					}
					portMap = {};
				}

				fulfill( portMap );
			} );
		}

		/**
		 * Create a new JSON collection and write it to the port file.
		 *
		 * @param {String} portMap
		 * @returns {NPromise}
		 */
		function updatePortMap( portMap ) {
			return new NPromise( function ( fulfill, reject ) {
				fs.readFile( manifest, {encoding: 'utf8'}, function( err, data ) {
					if ( err ) {
						reject( err );
					} else {
						var project_data = JSON.parse( data );

						// Update both the domains and the ports
						for ( var i = 0, l = project_data.hosts.length; i < l; i ++ ) {
							var host = project_data.hosts[ i ];

							portMap.domains = portMap.domains || {};
							portMap.domains[ host ] = port;

							portMap.ports = portMap.ports || {};
							portMap.ports[ port ] = portMap.ports[ port ] || [];
							portMap.ports[ port ].push( host );
						}

						fs.writeFile( portMapFile, JSON.stringify( portMap, null, 2 ), function ( err ) {
							if ( err ) {
								reject( err );
							}
							fulfill( args );
						} );
					}

				} );
			} );
		}

		return readPortMapFile( portMapFile )
			.then( parsePortMapJSON, reject )
			.then( updatePortMap, reject )
			.then( fulfill );
	} );
}

/**
 * Send the actual command to the server.
 *
 * @param {Array} args
 * @returns {NPromise}
 */
function send_command( args ) {
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
				cmd_args.port = data.port;
			}
		} );

		connection.done( function() { return fulfill( cmd_args ); }, reject );
	} );
}

/**
 * Create a Docker chain supporiting a specific project.
 *
 * @type {String}
 */
module.exports = commands.create_chain = function ( project ) {
	return resolveProject( project )
		.then( send_command )
		.then( update_portmap );
};

/**
 * Route the command
 */
app.cmd( /create-chain\s?((--url[=\s])?\S+)?/, function ( project, is_url ) {
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