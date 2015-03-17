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

"use strict";

/**
 * Module dependencies.
 */
var fs = require( 'fs' ),
	path = require( 'path' ),
	NPromise = require( 'promise' );

function install( manifest, directory ) {
	directory = directory || process.cwd();
	function maybeWriteManifest( manifest ) {
		if ( 'string' === typeof manifest ) {
			return NPromise.resolve( manifest );
		}
		return new NPromise( function ( fulfill, reject ) {
			if ( 'object' !== typeof manifest ) {
				reject( 'Something went wrong parsing the manifest' );
			}
			var manifestFile = path.join( directory, 'composer.json' ),
				writeStream = fs.createWriteStream( manifestFile, {flags: 'w+'} );
			writeStream.on( 'error', reject );
			writeStream.on( 'finish', function () {
				fulfill( manifestFile );
			} );
			writeStream.write( JSON.stringify( manifest, null, 2 ) );
			writeStream.end();
		} );
	}

	return maybeWriteManifest( manifest );
}

module.exports = {
	install: install
};
