'use strict';

var print = require( 'winston' ).cli(),
	app = require( '../app' ),
	fs = require( 'fs' ),
	commands = require( '../commands' ),
	command = require( '../command'),
	targz = require( 'tar.gz' ),
	NPromise = require( 'promise');

/**
 * Simple error exit with error message
 */
function _exit( message ) {
	print.error( message );
	process.exit( 1 );
}

/**
 * Export command wrapper.
 */
module.exports = function( path ) {
	var dir = '.';

	if ( path ) {
		// Untrailingslashit
		dir = path.replace( /\/$/, '' );
	}

	if ( ! fs.existsSync( dir + '/manifest.json' ) ) {
		_exit( 'No manifest.json file exists in this directory. Are you sure this is a Derrick project?' );
	}

	var manifest = JSON.parse( fs.readFileSync( dir + '/manifest.json' ) );

	var vendorsByName = {};
	var devsByName = {};

	/**
	 * We store vendor/dev resources as an object with the name as key to make our
	 * lives easier later.
	 */
	manifest.vendor_resources.forEach( function( resource ) {
		vendorsByName[resource.name] = resource;
	} );

	manifest.dev_resources.forEach( function( resource ) {
		devsByName[resource.name] = resource;
	} );

	/**
	 * Parse vendor resources from live installation for manifest file
	 */
	function parseVendorResources( type ) {
		return new NPromise( function( fulfill ) {
			commands.wp( '', '', [type, 'list', '--format=json']).then( function( output ) {
				var resources = JSON.parse( output );

				resources.forEach( function( resource ) {

					// first make sure it's not already a dev resource
					if ( devsByName[resource.name] ) {
						return;
					}

					if ( vendorsByName[resource.name] && type === vendorsByName[resource.name].type ) {
						// If plugin exists in manifest

						// Update reference
						vendorsByName[resource.name].reference = resource.reference;
					} else {
						// If plugin does not exist in manifest

						vendorsByName[resource.name] = {
							name: resource.name,
							reference: resource.reference,
							type: type
						};
					}

				} );

				fulfill();
			}, function( error ) {
				_exit( error );
			} );
		} );
	}

	/**
	 * Write the manifest file to the file system
	 */
	function writeManifest() {
		print.info( 'Writing new manifest.json file.' );

		manifest.vendor_resources = [];

		for ( var key in vendorsByName ) {
			manifest.vendor_resources.push( vendorsByName[key] );
		}

		fs.writeFileSync( dir + '/manifest.json', JSON.stringify( manifest ) );
	}

	/**
	 * Export database to project root
	 */
	function exportDatabase() {
		return new NPromise( function( fulfill ) {
			commands.wp( '', '', ['eval', 'echo DB_NAME;']).then( function( output ) {

				commands.export_db( output ).then( function() {
					print.info( 'Exported database' );

					fulfill();
				} );

			}, function() {
				_exit( 'Could not export database' );
			} );
		} );
	}

	/**
	 * Export uploads as tar.gz to project root
	 */
	function exportUploads() {
		return new NPromise( function( fulfill ) {
			print.info( 'Starting uploads export' );

			var date = new Date().toISOString().replace( 'T', '-' ).replace( /\..+/, '' ).replace( /\:/g, '-' );

			new targz().compress( dir + '/uploads', dir + '/../' + manifest.name.toLowerCase().replace( /[^a-z0-9]/ig, '' ) + '-uploads-' + date + '.tar.gz', function( error ) {
				if( error ) {
					_exit( error );
				}

				print.info( 'Finished exporting uploads to uploads-' + date + '.tar.gz' );

				fulfill();
			} );
		});
	}

	return parseVendorResources( 'plugin' )
		.then( function() {
			return parseVendorResources( 'theme' );
		} )
		.then( writeManifest )
		.then( exportDatabase )
		.then( exportUploads );
};

/**
 * Route the command
 */
app.cmd( /export\s?([^\s]+)?/, function() {
	module.exports().then( function() {
		print.info( 'All done! Cleaning up a few things...' );

		command.closeConnections();
	} );
} );

