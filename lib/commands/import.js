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

/**
 * Module dependencies.
 */

'use strict';

var path = require( 'path' ),
	fs = require( 'fs' ),
	os = require( 'os' ),
	exec = require( 'child_process' ).exec,
	NPromise = require( 'promise' ),
	mkdirp = require( 'mkdirp' ),
	resolve = require( '../resolve' ),
	resources = require( '../resources' ),
	print = require( 'winston' ).cli(),
	VM = require( '../vm' ),
	_ = require( 'lodash' ),
	composer_cache = false,
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
	_exit( 1, msg );
}

function writeJson( data, file ) {
	return new NPromise( function ( fulfill, reject ) {
		var writeStream = fs.createWriteStream( file, {flags: 'w+'} );
		writeStream.on( 'error', reject );
		writeStream.on( 'finish', function () {
			fulfill( file );
		} );
		writeStream.write( JSON.stringify( data, null, 2 ) );
		writeStream.end();
	} );
}

/**
 * Check to make sure vagrant is running and available
 *
 * @param {Array} args
 * @returns {NPromise}
 */
function ensureVagrantIsRunning( args ) {

	var vm = args[0];

	function checkServerAvailability( vm ) {
		var net = require( 'net' );
		return new NPromise( function ( fulfill, reject ) {
			var client = net.createConnection( 239, 'derrick.dev' );

			client.on( 'connect', function () {
				fulfill( vm );
				client.destroy();
			} );

			client.on( 'error', reject );

			// If we can't connect after 10 seconds, reject and destroy client.
			client.setTimeout( 10000, function () {
				client.destroy();

				reject();
			} );
		} );
	}

	return new NPromise( function ( fulfill, reject ) {
		checkServerAvailability( vm )
			.then( function () {
				fulfill( args );
			}, vm.start.bind( vm ) )
			.then( function () {
				fulfill( args );
			}, reject );
	} );
}

/**
 * Parse JSON and return it
 *
 * @param args
 * @returns {NPromise}
 */
function parseJSON( args ) {
	return new NPromise( function ( fulfill, reject ) {
		var data;

		try {
			data = JSON.parse( args[0] );
		} catch ( e ) {
			reject( 'Could not parse JSON!\n\n' +
			'Error message:\n' + e + '\n' );
		}

		fulfill( [data, args[1]] );
	} );
}

/**
 * Parse a configuration file.
 *
 * @param {string} thing
 */
function parseConfig( args ) {

	var data = args[0];
	configFile = args[1];

	return new NPromise( function ( fulfill, reject ) {
		var vm, x;

		var requiredFields = [
			'name',
			'hostname',
			'dev_resources',
			'vendor_resources',
			'database',
			'uploads'
		];

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

		// make sure we have a webserver declared
		data.webserver = (data.webserver && 'apache' === data.webserver) ? 'apache' : 'nginx';

		var minorVersion = /^(5\.[3-6])(\.\d.*)?$/.exec( data.php || '' );
		if ( null === minorVersion ) {
			data.php = '5.6';
		} else {
			data.php = minorVersion[1];
		}

		var wpPromise = new NPromise( function ( yup, nope ) {
			if ( data.wordpress ) {
				yup( data.wordpress );
			}
			resolve( 'http://api.wordpress.org/core/version-check/1.7/' ).then( function () {
				var versionCheck,
					latestVersion;
				try {
					versionCheck = JSON.parse( arguments[0][0] );
					latestVersion = versionCheck.offers[0].current;
				} catch ( e ) {
					nope( e );
				}
				if ( latestVersion ) {
					data.wordpress = latestVersion;
					return yup( latestVersion );
				}
				nope( 'Couldn\'t find current WordPress version!' );
			}, nope );
		} );

		wpPromise.then( function () {
			fulfill( [vm, data] );
		}, reject );
	} );
}

/**
 * Make sure a project directory exists.
 *
 * @param {Array} args
 * @returns {NPromise}
 */
function createProjectDirectories( args ) {

	var vm = args[0],
		data = args[1];

	var mkdir = NPromise.denodeify( mkdirp );

	return new NPromise( function ( fulfill ) {
		var project = path.join( vm.root, 'projects', data.name );

		data.project = project;

		mkdir( project )
			.then(
			NPromise.all( [
				mkdir( path.join( project, 'config/nginx/sites' ) ),
				mkdir( path.join( project, 'config/nginx/conf.d' ) ),
				mkdir( path.join( project, 'vendor' ) ),
				mkdir( path.join( project, 'src' ) ),
				mkdir( path.join( project, 'util' ) )
			] ) )
			.then(
			NPromise.all( [
				mkdir( path.join( project, 'vendor/plugins' ) ),
				mkdir( path.join( project, 'vendor/mu-plugins' ) ),
				mkdir( path.join( project, 'vendor/themes' ) ),
				mkdir( path.join( project, 'src/plugins' ) ),
				mkdir( path.join( project, 'src/mu-plugins' ) ),
				mkdir( path.join( project, 'src/themes' ) )
			] ) )
			.then( function () {
				fulfill( [vm, data] );
			}, _exit_error );
	} );
}

/**
 * Move an existing manifest.json file
 *
 * @param {Array} args
 * @returns {NPromise}
 */
function moveManifestFile( args ) {

	var data = args[1];

	return new NPromise( function ( fulfill, reject ) {
		if ( !configFile ) {
			return reject( 'Could not move manifest file into project directory' );
		}
		var targetLocation = path.join( fs.realpathSync( data.project ), 'manifest.json' );
		if ( fs.realpathSync( configFile ) === targetLocation ) {
			fulfill( args );
		}
		print.info( 'Copying manifest to project directory...' );
		var manifestStream = fs.createWriteStream( targetLocation, {flags: 'w+'} );
		manifestStream.on( 'finish', function () {
			fulfill( args );
		} );
		manifestStream.on( 'error', reject );
		fs.createReadStream( configFile ).pipe( manifestStream );
	} );
}

/**
 * Create a new manifest.json file
 *
 * @param {Array} args
 * @returns {NPromise}
 */
function createManifestFile( args ) {

	var data = args[1];

	return new NPromise( function ( fulfill, reject ) {

		var path = data.project + '/manifest.json';

		fs.writeFile( path, JSON.stringify( data ), function ( error ) {
			if ( error ) {
				reject();
			} else {
				fulfill( args );
			}
		} );
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
	return new NPromise( function ( fulfill, reject ) {
		print.info( 'Fetching dev resources...' );
		var resourcePromises = [], x;

		try {
			for ( x = 0; x < rawResources.length; x += 1 ) {
				var resource = resources.VcsResource.newFromVcs( rawResources[x] ),
					pathName = path.join( project, 'src', resource.path );

				if ( fs.existsSync( pathName ) ) {
					print.log( 'info', 'Dependency %s already installed.', resource.name );
					resourcePromises.push( NPromise.resolve( resource ) );
				} else {
					mkdirp.sync( pathName );
					print.log( 'info', 'Fetching %s...', resource.name );
					resourcePromises.push( resource.install( pathName ) );
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
 * @param {String} wpVersion
 * @param {String} project
 *
 * @returns {*}
 */
function installVendorResources( vendorResources, wpVersion, project ) {
	return new NPromise( function ( fulfill, reject ) {
		var resourcePromises = [],
			x,
			composerManifest = {
				repositories       : [
					{
						type: "composer",
						url : "http://wpackagist.org"
					}
				],
				"minimum-stability": "dev",
				"prefer-stable"    : true,
				require            : {
					"composer/installers" : "~1.0",
					"johnpbloch/wordpress": wpVersion
				},
				"require-dev"      : {},
				extra              : {
					"installer-paths"      : {
						"vendor/plugins/{$name}/": ["type:wordpress-plugin"],
						"vendor/themes/{$name}/" : ["type:wordpress-theme"],
						"vendor/mu-plugins/{$name}/": ["type:wordpress-mu-plugin"]
					},
					"wordpress-install-dir": "vendor/wordpress"
				}
			},
			composer = require( './composer' );

		// If the cache was set up on import ...
		if ( composer_cache ) {
			composerManifest.repositories.unshift( { type: "composer", url: composer_cache } );
		}

		try {
			for ( x = 0; x < vendorResources.length; x += 1 ) {
				var resource = resources.Resource.newFromData( vendorResources[x] ),
					composerRequirement = resource.guessComposer(),
					resourcePath = path.join( project, 'vendor', resource.path );
				if ( composerRequirement ) {
					_.assign( composerManifest.require, composerRequirement );
					continue;
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

			// We don't want WordPress showing up as a vendor resource elsewhere
			vendorResources.pop();
		} catch ( e ) {
			reject( e );
		}

		resourcePromises.push( writeJson( composerManifest, path.join( project, 'composer.json' ) ).then( function () {
			return composer.install( project );
		} ) );

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
	return new NPromise( function ( resolve, reject ) {
		try {
			require( '../commands' ).create_db( name, name, name ).then( resolve, reject );
		} catch ( e ) {
			reject( e );
		}
	} );
}

/**
 * Import uploads as provided in manifest.json
 *
 * @param location
 * @param projectDir
 * @returns {*}
 */
function importUploads( location, projectDir ) {
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
	var data = args[1];
	return new NPromise( function ( fulfill, reject ) {
		try {

			NPromise.resolve( function() {
				if ( data.database ) {
					return commands.import_db( data.name, data.database );
				} else {
					return true;
				}
			} ).then( function() {
				if ( data.uploads ) {
					return importUploads( data.uploads, data.project );
				} else {
					return true;
				}
			} ).then( function () {
				fulfill( args );
			}, reject );
		} catch ( e ) {
			reject( e );
		}
	} );
}

/**
 * Copy the MU-plugin autoloader into the vendor mu-plugin directory.
 *
 * @param {string} project
 *
 * @returns {NPromise}
 */
function createAutoloader( project ) {
	print.info( 'Creating WordPress MU-Plugin Autoloader...' );

	/**
	 * Grab the contents of the template file
	 *
	 * @returns {NPromise}
	 */
	function getTemplate() {
		return new NPromise( function ( fulfill, reject ) {
			var templateFile = path.normalize( path.join( __dirname, '../../templates/autoloader.php.tmpl' ) );
			fs.readFile( templateFile, {encoding: 'utf-8'}, function ( err, data ) {
				if ( err ) {
					reject( err );
				}
				fulfill( data );
			} );
		} );
	}

	/**
	 * Compile the template and write it to our project
	 *
	 * @param {string} template
	 *
	 * @returns {NPromise}
	 */
	function writeTemplate( template ) {
		var loaderLocation = path.join( project, 'vendor', 'mu-plugins', 'autoloader.php' );

		return new NPromise( function ( fulfill, reject ) {
			var loader = fs.createWriteStream( loaderLocation, {flags: 'w+'} );;
			loader.on( 'finish', function () {
				fulfill();
			} );
			loader.on( 'error', reject );
			loader.write( template );
			loader.end();
		} );
	}

	return getTemplate().then( writeTemplate );
}

/**
 * Create a WordPress config file for this project
 *
 * This function will fetch some new salts from WordPress.org and injects them and the database credentials into the
 * config file template.
 *
 * @param {Object} data
 * @returns {*}
 */
function createConfigFile( data ) {
	print.info( 'Creating WordPress config file...' );

	/**
	 * Grab the contents of the template file for the config
	 *
	 * @returns {NPromise}
	 */
	function getTemplate() {
		return new NPromise( function ( fulfill, reject ) {
			var templateFile = path.normalize( path.join( __dirname, '../../templates/wp-config.php.tmpl' ) );
			fs.readFile( templateFile, {encoding: 'utf-8'}, function ( err, data ) {
				if ( err ) {
					reject( err );
				}
				fulfill( data );
			} );
		} );
	}

	/**
	 * Fetch new salts from WordPress.org
	 *
	 * @returns {NPromise}
	 */
	function getSalts() {
		var request = require( 'request' );
		return new NPromise( function ( fulfill, reject ) {
			request( 'https://api.wordpress.org/secret-key/1.1/salt/', function ( error, response, body ) {
				if ( error ) {
					reject( error );
				}
				fulfill( body );
			} );
		} );
	}

	/**
	 * Compile the mustache template and write it to our project
	 *
	 * @returns {NPromise}
	 */
	function writeTemplate( args ) {
		var template = args[0],
			salts = args[1],
			configFileLocation = path.join( data.project, 'config', 'wp-config.php' ),
			Mustache = require( 'mustache' ),
			templateData = {
				db   : {
					name: data.name,
					user: data.name,
					pass: data.name
				},
				salts: salts
			};
		return new NPromise( function ( fulfill, reject ) {
			var config = fs.createWriteStream( configFileLocation, {flags: 'w+'} ),
				configContents = Mustache.render( template, templateData );
			config.on( 'finish', function () {
				fulfill( configContents );
			} );
			config.on( 'error', reject );
			config.write( configContents );
			config.end();
		} );
	}

	/**
	 * Get the salts and template data in parallel, then write the data.
	 */
	return NPromise.all( [getTemplate(), getSalts()] )
		.then( writeTemplate );
}

/**
 * Create the default Nginx configuration files.
 *
 * @param {Object} data
 */
function createNginxConfigs( data ) {
	print.info( 'Creating Nginx config files...' );

	/**
	 * Grab the contents of the template file for the config
	 *
	 * @returns {NPromise}
	 */
	function getTemplate( template ) {
		return new NPromise( function ( fulfill, reject ) {
			var templateFile = path.normalize( path.join( __dirname, '../../templates/' + template + '.tmpl' ) );
			fs.readFile( templateFile, {encoding: 'utf-8'}, function ( err, data ) {
				if ( err ) {
					reject( err );
				}
				fulfill( data );
			} );
		} );
	}

	/**
	 * Compile the mustache template and write it to our project
	 *
	 * @returns {NPromise}
	 */
	function writeTemplates( args ) {
		var siteTemplate = args[0],
			nginxTemplate = args[1],
			urls = data.hostname.join( ' ' ),
			siteConfigFileLocation = path.join( data.project, 'config/nginx/sites/default.conf' ),
			nginxConfigFileLocation = path.join( data.project, 'config/nginx/conf.d/wp.conf' ),
			Mustache = require( 'mustache' ),
			templateData = {
				host: {
					urlstrings: urls
				}
			};

		return new NPromise( function ( fulfill ) {
			var sitePromise = new NPromise( function ( fulfill, reject ) {
					var config = fs.createWriteStream( siteConfigFileLocation, {flags: 'w+'} ),
						siteConfigContents = Mustache.render( siteTemplate, templateData );

					config.on( 'finish', function () {
						fulfill( siteConfigContents );
					} );

					config.on( 'error', reject );
					config.write( siteConfigContents );
					config.end();
				} ),
				configPromise = new NPromise( function ( fulfill, reject ) {
					var config = fs.createWriteStream( nginxConfigFileLocation, {flags: 'w+'} ),
						siteConfigContents = Mustache.render( nginxTemplate, templateData );

					config.on( 'finish', function () {
						fulfill( siteConfigContents );
					} );

					config.on( 'error', reject );
					config.write( siteConfigContents );
					config.end();
				} );

			return NPromise.all( [sitePromise, configPromise] ).then( fulfill );
		} );
	}

	/**
	 * Get the salts and template data in parallel, then write the data.
	 */
	return NPromise.all( [getTemplate( 'default.conf' ), getTemplate( 'wp.conf' )] )
		.then( writeTemplates );
}

/**
 * Run the import chain.
 *
 * @param {Array} args
 * @returns {NPromise}
 */
function runImport( args ) {
	return new NPromise( function ( fulfill ) {
		var vm = args[0],
			data = args[1];

		NPromise.all( [
			installDevResources( data.dev_resources, data.project ),
			installVendorResources( data.vendor_resources, data.wordpress, data.project ),
			createAutoloader( data.project ),
			createDatabase( data.name ),
			createConfigFile( data ),
			createNginxConfigs( data )
		] ).then( function () {
			fulfill( [vm, data] );
		}, _exit_error );
	} );
}

/**
 * Create the manfiest.lock file for the project.
 *
 * @param args
 *
 * @returns {NPromise}
 */
function createLockFile( args ) {
	var vm = args[0],
		data = args[1];

	function windowCleaner( thing ) {
		return thing.replace ? thing.replace( /\\+/g, '/' ) : thing;
	}

	function compileLockData() {
		var date = new Date();
		return new NPromise( function ( fulfill ) {
			var lockData = {
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
					webserver        : data.webserver,
					wordpress        : data.wordpress,
					wordpressPath    : windowCleaner( path.relative( vm.root, path.join( data.project, 'vendor', 'wordpress' ) ) ),
					php              : data.php,
					resourceLocations: {
						'wp-config.php'     : windowCleaner( path.relative( vm.root, path.join( data.project, 'config', 'wp-config.php' ) ) ),
						'wp-content/uploads': windowCleaner( path.relative( vm.root, path.join( data.project, 'uploads' ) ) ),
						'wp-content': windowCleaner( path.relative( vm.root, path.join( data.project, 'src' ) ) ),
						'wp-content/plugins': windowCleaner( path.relative( vm.root, path.join( data.project, 'vendor/plugins' ) ) ),
						'wp-content/mu-plugins': windowCleaner( path.relative( vm.root, path.join( data.project, 'vendor/mu-plugins' ) ) ),
						'wp-content/themes': windowCleaner( path.relative( vm.root, path.join( data.project, 'vendor/themes' ) ) )
					}
				},
				i,
				key,
				resource;

			fulfill( lockData );
		} );
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
	return compileLockData()
		.then( writeLockData, _exit_error );
}

/**
 * Store hosts map file
 *
 * @param args
 * @returns {*}
 */
function storeHostsMap( args ) {
	var vm = args[0],
		data = args[1],
		hostsMapFile = path.join( vm.root, 'sys', 'hosts.json' );

	print.info( 'Storing project hosts mapping...' );

	function readHostsMapFile( file ) {
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

	function parseHostsMapJson( fileContents ) {
		return new NPromise( function ( fulfill, reject ) {
			var hostsMap;
			try {
				hostsMap = JSON.parse( fileContents );
			} catch ( e ) {
				if ( '' !== fileContents ) {
					return reject( e );
				}
				hostsMap = {};
			}
			fulfill( hostsMap );
		} );
	}

	function updateHostsMap( hostsMap ) {
		return new NPromise( function ( fulfill, reject ) {
			var x = 0,
				hosts = data.hostname,
				host,
				projectDirectory = path.basename( data.project );
			for ( ; x < hosts.length; x += 1 ) {
				host = hosts[x];
				hostsMap[host] = projectDirectory;
			}
			fs.writeFile( hostsMapFile, JSON.stringify( hostsMap, null, 2 ), function ( err ) {
				if ( err ) {
					reject( err );
				}
				fulfill( args );
			} );
		} );
	}

	return readHostsMapFile( hostsMapFile )
		.then( parseHostsMapJson, _exit_error )
		.then( updateHostsMap, _exit_error );
}

/**
 * Create the alias files for the `wp` and `phpunit` commands.
 *
 * @param args
 * @returns {*}
 */
function createAliases( args ) {
	var vm = args[0],
		data = args[1];

	print.info( 'Creating project aliases for wp and phpunit commands.' );

	/**
	 * Grab the contents of the template file for the config
	 *
	 * @returns {NPromise}
	 */
	function getTemplate( template ) {
		return new NPromise( function ( fulfill, reject ) {
			var templateFile = path.normalize( path.join( __dirname, '../../templates/' + template + '.tmpl' ) );
			fs.readFile( templateFile, {encoding: 'utf-8'}, function ( err, data ) {
				if ( err ) {
					reject( err );
				}
				fulfill( data );
			} );
		} );
	}

	/**
	 * Write out the actual template files.
	 *
	 * @param args
	 *
	 * @returns NPromse
	 */
	function writeTemplates( args ) {
		return new NPromise( function( fulfill ) {
			var templates = {
				'phpunit.bat': args[0],
				'phpunit'    : args[1],
				'wp.bat'     : args[2],
				'wp'         : args[3]
				},
				promises = [];

			for ( var file in templates ) {
				if ( ! templates.hasOwnProperty( file ) ) {
					continue;
				}

				var filePromise = new NPromise( function( fulfill, reject ) {
					var writeLocation = path.join( data.project, file ),
						stream = fs.createWriteStream( writeLocation, {flags: 'w+'});

					stream.on( 'finish', function() {
						fulfill( templates[ file ] );
					} );

					stream.on( 'error', reject );
					stream.write( templates[ file ] );
					stream.end();
				} );
				promises.push( filePromise );
			}

			return NPromise.all( promises ).then( fulfill );
		} );
	}

	// Get templates in parallel and write the data
	return NPromise.all( [getTemplate( 'phpunit.bat' ), getTemplate( 'phpunit' ), getTemplate( 'wp.bat' ), getTemplate( 'wp' )] )
		.then( writeTemplates );
}

/**
 * Store hosts map and create lock file
 *
 * @param args
 * @returns {NPromise}
 */
function writeCompiledData( args ) {
	return new NPromise( function ( fulfill ) {
		NPromise.all( [createLockFile( args ), storeHostsMap( args ), createAliases( args )] )
			.then( function () {
				fulfill( args );
			}, _exit_error );
	} );
}

/**
 * Create a chain
 *
 * @param args
 * @returns {*}
 */
function create_chain( args ) {
	var data = args[1];
	return commands.create_chain( path.join( data.project, 'manifest.lock' ) )
		.then( function () {
			return NPromise.resolve( args );
		}, _exit_error );
}

/**
 * Update the root `aliases` file and trigger `vagrant ghost` to re-import everything.
 *
 * @param args
 *
 * @returns {NPromise}
 */
function update_hosts( args ) {
	var vm = args[0],
		data = args[1],
		aliases = path.join( vm.root, 'aliases' );

	print.info( 'Updating hosts files...' );

	/**
	 * Read in or create the aliases file.
	 *
	 * @param {string} file
	 */
	function readAliasFile( file ) {
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
	 * Read in any contents of the existing file.
	 *
	 * @param {string} contents
	 */
	function parseAliasFile( contents ) {
		return new NPromise( function( fulfill, reject ) {
			try{
				var newLine = os.EOL,
					aliasData = contents.split( newLine );

				fulfill( aliasData );
			} catch ( e ) {
				fulfill( [] );
			}
		} );
	}

	/**
	 * Add the project domains to the list of aliases and write out to the correct file.
	 *
	 * @param {Array} aliasData
	 */
	function writeAliasFile( aliasData ) {
		return new NPromise( function( fulfill, reject ) {
			var x = 0,
				hosts = data.hostname;

			// Merge our project hosts with any hosts we already know
			aliasData = _.union( aliasData, hosts );

			// Remove "empty" elements
			aliasData = _.filter( aliasData, function( val ) { return !!val; } );

			// Create our output file.
			var aliasContents = aliasData.join( os.EOL );

			// Write our output file
			fs.writeFile( aliases, aliasContents, function( err ) {
				if ( err ) {
					reject( err );
				}
				fulfill( args );
			} );
		} );
	}

	return readAliasFile( aliases )
		.then( parseAliasFile )
		.then( writeAliasFile );
}

/**
 * Trigger `vagrant ghost` so the VM gets the new hosts
 *
 * @param {Array} args
 *
 * @return {NPromise}
 */
function resync_hosts( args ) {
	return new NPromise( function( fulfill, reject ) {
		var resync = exec( 'vagrant ghost' );

		resync.stderr.on( 'data', function( data ) {
			print.info( 'Unable to update your hosts file. You will need to update things manually.' );
		} );

		resync.on( 'close', function() {
			fulfill( args );
		} );
	} );
}

/**
 * Run import starting with file path
 */
module.exports.import_file = function( config ) {
	var satis = app.argv.satis || app.config.get('satis');
	if ( undefined === satis ) {
		composer_cache = false;
	} else {
		composer_cache = satis.toLowerCase();
	}

	if ( undefined === config ) {
		config = 'manifest.json';
	}

	print.info( 'Starting Import...' );

	// Let's kick off the import
	return resolve( config )
		.then( parseJSON, _exit_error )
		.then( parseConfig, _exit_error )
		.then( ensureVagrantIsRunning, _exit_error )
		.then( createProjectDirectories, _exit_error )
		.then( moveManifestFile, _exit_error )
		.then( runImport, _exit_error )
		.then( importDatabaseAndUploads, _exit_error )
		.then( writeCompiledData, _exit_error )
		.then( create_chain, _exit_error )
		.then( update_hosts, _exit_error )
		.then( resync_hosts, _exit_error )
		.then( function () {
			print.info( 'All done! Cleaning up a few things...' );
			return require( '../command' ).closeConnections();
		} );
};

/**
 * Run import starting with JSON
 */
module.exports.import_json = function( json ) {
	return parseConfig( [ json, false ] )
		.then( ensureVagrantIsRunning, _exit_error )
		.then( createProjectDirectories, _exit_error )
		.then( createManifestFile, _exit_error )
		.then( runImport, _exit_error )
		.then( importDatabaseAndUploads, _exit_error )
		.then( writeCompiledData, _exit_error )
		.then( create_chain, _exit_error )
		.then( update_hosts, _exit_error )
		.then( resync_hosts, _exit_error )
		.then( function () {
			print.info( 'All done! Cleaning up a few things...' );

			require( '../command' ).closeConnections();
		} );
};

/**
 * Route the command
 */
app.cmd( /import\s?([^\s]+)?/, module.exports.import_file );
