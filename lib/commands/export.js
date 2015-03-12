'use strict';

var print = require( 'winston' ).cli(),
	app = require( '../app' ),
	fs = require( 'fs' ),
	commands = require( '../commands' ),
	NPromise = require( 'promise' );

function _exit( message ) {
	print.error( message );
	process.exit( 1 );
}

/**
 * Export command wrapper.
 */
var exportCommand = function( path ) {
	var dir = '.';

	if ( path ) {
		// Untrailingslashit
		dir = path.replace( /\/$/, '' );
	}

	if ( ! fs.existsSync( dir + '/manifest.json' ) ) {
		print.error( 'No manifest.json file exists in this directory. Are you sure this is a Moonshine project?' );
		process.exit( 1 );
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

	// Let's grab our vendor plugins

	function parseVendorResources( type ) {
		return new NPromise( function( fulfill, reject ) {
			commands.wp( type, 'list', { 'format': 'json' }).done( function( error, output ) {
				if ( error ) {
					reject();
				}

				var resources = JSON.parse( output );

				resources.forEach( function( resource ) {

					// first make sure it's not already a dev resource
					if ( devsByName[resource.name] ) {
						return;
					}

					if ( vendorsByName[resource.name] && type === vendorsByName[resource.name].type ) {
						// If plugin exists in manifest

						// Update reference
						vendorsByName.reference = resource.reference;
					} else {
						// if plugin does not exist in manifest

						vendorsByName[resource.name] = {
							name: resource.name,
							reference: resource.reference,
							type: 'plugin'
							// url: ...... ???
						};
					}

				} );

				fulfill();
			} );
		} );
	}

	NPromise.all( [
		parseVendorResources( 'plugin' ),
		parseVendorResources( 'theme' )
	] ).then( function () {

		print.info( 'Writing new manifest.json file.' );

		fs.writeFileSync( dir + '/manifest.json', JSON.stringify( manifest ) );

		commands.wp( 'eval', "'echo DB_NAME;'").done( function( error, output ) {
			if ( error ) {
				_exit( 'Could not export database' );
			}

			commands.export_db( output )
		} );

	}, _exit( 'Could not write new manifest.json file.' ) );
};

/**
 * Route the command
 */
app.cmd( /export\s?([^\s]+)?/, exportCommand );

