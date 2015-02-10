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
	VM = require( '../vm' ),
	configFile;

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
function parseConfig( args ) {
	"use strict";
	var thing = args[0];
	configFile = args[1];
	return new NPromise( function ( fulfill, reject ) {
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

		fulfill( [vm, data] );
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

		mkdir( project ).then( function () {
			fulfill( [vm, data] );
		}, _exit_error );
	} );
}

function moveManifestFile( data ) {
	"use strict";
	return new NPromise( function ( fulfill, reject ) {
		if ( !configFile ) {
			return reject( 'Could not move manifest file into project directory' );
		}
		var targetLocation = path.join( fs.realpathSync( data.project ), 'manifest.json' );
		if ( fs.realpathSync( configFile ) === targetLocation ) {
			fulfill( targetLocation );
		}
		print.info( 'Copying manifest to project directory...' );
		var manifestStream = fs.createWriteStream( targetLocation, {flags: 'w+'} );
		manifestStream.on( 'finish', function () {
			fulfill( targetLocation );
		} );
		manifestStream.on( 'error', reject );
		fs.createReadStream( configFile ).pipe( manifestStream );
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
	return new NPromise( function ( fulfill, reject ) {
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

		NPromise.all( resourcePromises ).then( function () {
			fulfill( true );
		}, function ( res ) {
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
	return new NPromise( function ( fulfill, reject ) {
		var resourcePromises = [], x;

		try {
			for ( x = 0; x < vendorResources.length; x += 1 ) {
				var resource = resources.Resource.newFromData( vendorResources[x] ),
					resourcePath = path.join( cache, resource.path );
				if ( resource.reference ) {
					resourcePath = path.join( resourcePath, resource.reference );
				}

				if ( fs.existsSync( resourcePath ) ) {
					print.log( 'info', 'Dependency %s already installed.', resource.name );
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

		NPromise.all( resourcePromises ).then( function () {
			fulfill( true );
		}, function ( res ) {
			reject( 'Not all vendor resources could be installed.\n' + res );
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
			require( '../commands' ).create_db( name, name, name ).then( resolve, reject );
		} catch ( e ) {
			reject( e );
		}
	} );
}

function importUploads( location, projectDir ) {
	"use strict";
	var download = require( '../download' ),
		temp = require( '../temp' ),
		zlib = require( 'zlib' ),
		tar = require( 'tar' );

	print.info( 'Importing uploads tarball...' );

	function maybeDownloadUploads( uploads ) {
		if ( !/^https?:\/\//.test( uploads ) ) {
			return NPromise.resolve( uploads );
		}
		print.info( 'Downloading uploads tarball...' );
		return download( uploads, temp.createWriteStream( {suffix: '.tar.gz'} ) );
	}

	function unzipUploads( filePath ) {
		return new NPromise( function ( fulfill, reject ) {
			print.info( 'Unzipping uploads tarball...' );
			var output = temp.createWriteStream( {suffix: '.tar'} );
			output.on( 'finish', function () {
				fulfill( output.path );
			} );
			output.on( 'error', reject );
			fs.createReadStream( filePath ).pipe( zlib.createUnzip() ).pipe( output );
		} );
	}

	function unpackTar( filePath ) {
		return new NPromise( function ( fulfill, reject ) {
			print.info( 'Unpacking uploads tarball...' );
			var extract = tar.Extract( {path: projectDir} )
				.on( 'end', function () {
					fulfill( projectDir );
				} )
				.on( 'error', reject );
			fs.createReadStream( filePath )
				.on( 'error', reject )
				.pipe( extract );
		} );
	}

	return maybeDownloadUploads( location )
		.then( unzipUploads )
		.then( unpackTar );
}

/**
 * Import the SQL dump to the newly-created database.
 *
 * @param args
 */
function importDatabaseAndUploads( args ) {
	"use strict";
	var data = args[1];
	return new NPromise( function ( fulfill, reject ) {
		try {
			NPromise.all( [
				require( '../commands' ).import_db( data.name, data.database ),
				importUploads( data.uploads, data.project )
			] ).then( function () {
				fulfill( args );
			}, reject );
		} catch ( e ) {
			reject( e );
		}
	} );
}

/**
 * Run the import chain.
 *
 * @param {Array} args
 * @returns {NPromise}
 */
function runImport( args ) {
	"use strict";
	return new NPromise( function ( fulfill ) {
		var vm = args[0],
			data = args[1];

		NPromise.all( [
			moveManifestFile( data ),
			installDevResources( data.dev_resources, data.project ),
			installVendorResources( data.vendor_resources, data.cache ),
			createDatabase( data.name )
		] ).then( function () {
			fulfill( [vm, data] );
		}, _exit_error );
	} );
}

function createLockFile( args ) {
	"use strict";
	var vm = args[0],
		data = args[1];

	function windowCleaner( thing ) {
		return thing.replace ? thing.replace( /\\+/g, '/' ) : thing;
	}

	function compileLockData() {
		var date = new Date(),
			lockData = {
				name             : data.name,
				lastModified     : date.toISOString(),
				host             : data.hostname[0],
				hosts            : data.hostname,
				maintainers      : data.maintainers,
				dev_resources    : data.dev_resources,
				vendor_resources : data.vendor_resources,
				database         : data.database,
				uploads          : data.uploads,
				projectPath      : windowCleaner( path.relative( vm.root, data.project ) ),
				resourceLocations: {}
			},
			i,
			key,
			resource;

		for ( i = 0; i < data.dev_resources.length; i += 1 ) {
			resource = resources.VcsResource.newFromVcs( data.dev_resources[i] );
			key = windowCleaner( resource.path );
			lockData.resourceLocations[key] = windowCleaner( path.relative( vm.root, path.join( data.project, resource.path ) ) );
		}

		for ( i = 0; i < data.vendor_resources.length; i += 1 ) {
			resource = resources.Resource.newFromData( data.vendor_resources[i] );
			key = windowCleaner( path.join( resource.path, resource.reference ) );
			lockData.resourceLocations[key] = windowCleaner( path.relative( vm.root, path.join(
				vm.root,
				'_cache',
				resource.path,
				resource.reference
			) ) );
		}

		return lockData;
	}

	function writeLockData( lockData ) {
		return new NPromise( function ( fulfill, reject ) {
			var lockFile;
			lockFile = fs.createWriteStream( path.join( data.project, 'manifest.lock' ), {flags: 'w+'} )
				.on( 'error', reject )
				.on( 'finish', function () {
					fulfill( args );
				} );
			lockFile.write( JSON.stringify( lockData, null, 2 ) );
			lockFile.end();
		} );
	}

	print.info( 'Writing lock file...' );
	return writeLockData( compileLockData() );
}

/**
 * Prints the current version.
 *
 * @api public
 */
commands.import_manifest = function ( config ) {
	"use strict";
	if ( undefined === config ) {
		config = 'manifest.json';
	}

	print.info( 'Starting Import...' );

	// Let's kick off the import
	return resolve( config )
		.then( parseConfig, _exit_error )
		.then( createProjectDirectory, _exit_error )
		.then( runImport, _exit_error )
		.then( importDatabaseAndUploads, _exit_error )
		.then( createLockFile, _exit_error );
};

/**
 * Route the command
 */
app.cmd( /import\s?([^\s]+)?/, function ( config ) {
	"use strict";
	commands.import_manifest( config )
		.then( function () {
			print.info( 'All done!' );
			require( '../command' ).closeConnections();
		} );
} );
