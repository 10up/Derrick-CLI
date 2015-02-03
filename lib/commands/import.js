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
var path = require( 'path' ),
	fs = require( 'fs' ),
	NPromise = require( 'promise' ),
	mkdirp = require( 'mkdirp' ),
	resolve = require( '../resolve' ),
	resources = require( '../resources' ),
	print = require( 'winston' ).cli(),
	VM = require( '../vm' );

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
 * Kill the process and output an exit code.
 *
 * @param {Number} code
 * @param {String} msg
 * @private
 */
function _exit( code, msg ) {
	"use strict";
	if ( code && 'number' !== typeof code ) {
		msg = code;
		code = 0;
	}

	code = parseInt( code, 10 );
	if ( isNaN( code ) ) {
		code = 0;
	}

	msg += '';
	if ( msg ) {
		if ( code ) {
			print.error( msg );
		} else {
			print.debug( msg );
		}
	}

	process.exit( code );
}

/**
 * Explicitly exit with an error message.
 *
 * @param {String} msg
 * @private
 */
function _exit_error( msg ) {
	"use strict";
	_exit( 1, msg );
}

/**
 * Parse a configuration file.
 *
 * @param {string} thing
 */
function parseConfig( thing ) {
	"use strict";
	return new NPromise( function( fulfill, reject ) {
		var data, vm, x;

		var requiredFields = [
			'name',
			'hostname',
			'dev_resources',
			'vendor_resources',
			'database',
			'uploads'
		];

		try {
			data = JSON.parse( thing );
		} catch ( e ) {
			reject( 'Could not parse JSON!\n\n' +
			'Error message:\n' + e + '\n' );
		}

		for ( x = 0; x < requiredFields.length; x += 1 ) {
			if ( undefined === data[requiredFields[x]] ) {
				print.log( 'error', '%s is a required field!', requiredFields[x] );
				_exit_error( 'Aborting...' );
			}
		}

		try {
			vm = new VM( process.cwd() );
		} catch ( e ) {
			_exit_error( 'Error: ' + e + '\n' );
		}

		// Get a handle on the cache directory
		data.cache = path.join( vm.root, '_cache' );

		fulfill( [ vm, data ] );
	} );
}

/**
 * Make sure a project directory exists.
 *
 * @param {Array} args
 * @returns {NPromise}
 */
function createProjectDirectory( args ) {
	"use strict";
	var vm = args[0],
		data = args[1];

	var mkdir = NPromise.denodeify( mkdirp );

	return new NPromise( function ( fulfill ) {
		var projects = path.join( vm.root, 'projects' ),
			project = path.join( projects, data.name );

		data.project = project;

		mkdir( project ).then( function() {
			fulfill( [ vm, data ] );
		}, _exit_error );
	} );
}

/**
 * Make sure all dev resources are installed to the Projects directory.
 *
 * @param {Array} rawResources
 * @param project
 * @returns {*}
 */
function installDevResources( rawResources, project ) {
	"use strict";
	return new NPromise( function( fulfill, reject ) {
		print.info( 'Fetching dev resources...' );
		var resourcePromises = [], x;

		try {
			for ( x = 0; x < rawResources.length; x += 1 ) {
				var resource = resources.VcsResource.newFromVcs( rawResources[x] ),
					pathName = path.dirname( path.join( project, resource.path ) );

				if ( fs.existsSync( pathName ) ) {
					print.log( 'info', 'Dependency %s already installed.', resource.name );
					resourcePromises.push( NPromise.resolve( resource ) );
				} else {
					mkdirp.sync( pathName );
					print.log( 'info', 'Fetching %s...', resource.name );
					resourcePromises.push( resource.install( path.join( project, resource.path ) ) );
				}
			}
		} catch ( e ) {
			_exit_error( e );
		}

		NPromise.all( resourcePromises ).then( function() {
			fulfill( true );
		}, function( res ) {
			reject( 'Not all dev resources could be installed.\n' + res );
		} );
	} );
}

/**
 * Make sure all non-dev resources are installed correctly.
 *
 * @param {Array} vendorResources
 * @param {String} cache
 *
 * @returns {*}
 */
function installVendorResources( vendorResources, cache ) {
	"use strict";
	return new NPromise( function( fulfill, reject ) {
		var resourcePromises = [], x;

		try {
			for ( x = 0; x < vendorResources.length; x += 1 ) {
				var resource = resources.Resource.newFromData( vendorResources[x] ),
					resourcePath = path.join( cache, resource.path );
				if ( resource.reference ) {
					resourcePath = path.join( resourcePath, resource.reference );
				}

				if ( fs.existsSync( resourcePath ) ) {
					print.log( 'into', 'Dependency %s already installed.', resource.name );
					resourcePromises.push( NPromise.resolve( resource ) );
				} else {
					mkdirp.sync( path.dirname( resourcePath ) );
					print.log( 'info', 'Fetching %s...', resource.name );
					resourcePromises.push( resource.install( resourcePath ) );
				}
			}
		} catch ( e ) {
			reject( e );
		}

		NPromise.all( resourcePromises ).then( function() {
			fulfill( true );
		}, function( res ) {
			reject( 'Not all vendor resources coudl be installed.\n' + res );
		} );
	} );
}

/**
 * Create the database on the server.
 *
 * @param {String} name
 * @returns {NPromise}
 */
function createDatabase( name ) {
	"use strict";
	return new NPromise( function ( resolve, reject ) {
		try {
			var socket = require( '..' ).connect();
			socket.on( 'success', function () {
				socket.close();
				resolve( true );
			} );
			socket.on( 'error', function ( e ) {
				socket.close();
				reject( e );
			} );
			setTimeout( function () {
				socket.close();
				reject( 'Request timed out' );
			}, 10000 );
			socket.emit( 'create_db', {name: name} );
		} catch ( e ) {
			reject( e );
		}
	} );
}

/**
 * Import the SQL dump to the newly-created database.
 *
 * @param args
 */
function importDatabase( args ) {
	"use strict";
	var vm = args[0],
		data = args[1];
}

/**
 * Run the import chain.
 *
 * @param {Array} args
 * @returns {NPromise}
 */
function runImport( args ) {
	"use strict";
	return new NPromise( function( fulfill ) {
		var vm = args[0],
			data = args[1];

		NPromise.all( [
			installDevResources( data.dev_resources, data.project ),
			installVendorResources( data.vendor_resources, data.cache )//,
			//createDatabase( data.name )
		] ).then( function() {
			fulfill( [ vm, data ] );
		}, _exit_error );
	} );
}

/**
 * Prints the current version.
 *
 * @api public
 */
commands.import_manifest = function( config ) {
	"use strict";
	if ( undefined === config ) {
		config = 'manifest.json';
	}

	print.info( 'Starting Import...' );

	// Let's kick off the import
	resolve( config )
		.then( parseConfig, _exit_error )
		.then( createProjectDirectory, _exit_error )
		.then( runImport, _exit_error )
		//.then( importDatabase, _exit_error )
		//.then( importUploads, _exit_error )
		.then( function() { print.info( 'All done!' ); } );
};

/**
 * Route the command
 */
app.cmd( /import\s?([^\s]+)?/, commands.import_manifest );
