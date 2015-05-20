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
module.exports = function( projectName ) {

	if ( ! projectName ) {
		_exit( 'You must specify a project name!' );
	}

	try {
		var manifest = JSON.parse( fs.readFileSync( 'projects/' + projectName + '/manifest.json' ) );
	} catch ( error ) {
		_exit( 'Could not parse local manifest.json file.' );
	}

	var vendorsByName = {};
	var devsByName = {};

	/**
	 * We store vendor/dev resources as an object with the name as key to make our
	 * lives easier later.
	 */
	manifest.vendor_resources.forEach( function( resource ) {
		vendorsByName[resource.name.toLowerCase()] = resource;
	} );

	manifest.dev_resources.forEach( function( resource ) {
		var name = resource.name || resource.url.replace (/^.*\/(.*).git/ig, '$1' );

		devsByName[name.toLowerCase()] = resource;
	} );

	/**
	 * Parse vendor resources from live installation for manifest file
	 */
	function parseVendorResources( type ) {
		return new NPromise( function( fulfill ) {
			commands.wp( 'projects/' + projectName, '', [type, 'list', '--format=json']).then( function( output ) {
				try {
					var resources = JSON.parse( output );
				} catch( error ) {
					_exit( 'Could not properly parse plugins/themes from WordPress' );
				}

				resources.forEach( function( resource ) {
					var name = resource.name.toLowerCase();

					// first make sure it's not already a dev resource
					if ( devsByName[name] ) {
						return;
					}

					if ( vendorsByName[name] && type === vendorsByName[name].type ) {
						// If plugin exists in manifest

						// Update reference
						vendorsByName[name].reference = resource.reference;
					} else {
						// If plugin does not exist in manifest

						var vendorType = 'plugin';
						if ( 'must-use' === resource.status ) {
							vendorType = 'mu-plugin';
						}

						vendorsByName[name] = {
							name: resource.name,
							reference: resource.reference,
							type: vendorType
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

		fs.writeFileSync( 'projects/' + projectName + '/manifest.json', JSON.stringify( manifest ) );
	}

	/**
	 * Export database to project root
	 */
	function exportDatabase() {
		return new NPromise( function( fulfill ) {
			commands.wp( 'projects/' + projectName, '', ['eval', 'echo DB_NAME;']).then( function( output ) {

				commands.export_db( output ).then( function( filename ) {
					fulfill( filename );
				} );

			}, function() {
				_exit( 'Could not export database' );
			} );
		} ).then( function( filename ) {
			return new NPromise( function( fulfill ) {
				print.log( 'info', 'Moving database export to projects/%s', projectName );
				fs.rename( filename, 'projects/' + projectName + '/' + filename, fulfill );
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

			new targz().compress( 'projects/' + projectName + '/uploads', 'projects/' + manifest.name + '-uploads-' + date + '.tar.gz', function( error ) {
				if( error ) {
					_exit( error );
				}

				print.info( 'Finished exporting uploads to projects/uploads-' + date + '.tar.gz' );

				fulfill();
			} );
		});
	}

	return parseVendorResources( 'plugin' )
		.then( function() {
			return parseVendorResources( 'theme' );
		} )
		.then( writeManifest )
		.then( exportDatabase );
		//.then( exportUploads );
};

/**
 * Route the command
 */
app.cmd( /export\s?([^\s]+)?/, function( projectName ) {
	module.exports( projectName ).then( function() {
		print.info( 'All done! Cleaning up a few things...' );

		command.closeConnections();
	} );
} );