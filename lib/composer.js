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
	NPromise = require( 'promise' ),
	PassthruCommand = require( './commands/passthru-command' ),
	composerCommand;

function runCommand( url, cmd ) {
	composerCommand = composerCommand || new PassthruCommand( 'composer' );
	return composerCommand.command( url, cmd );
}

function install( manifest, directory ) {
	directory = directory || process.cwd();

	function maybeWriteManifest( manifest ) {
		if ( 'string' === typeof manifest && 'composer.json' === path.basename( manifest ) ) {
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

	function doInstall( manifest ) {
		return new NPromise( function ( fulfill, reject ) {
			var data;
			try {
				data = JSON.parse( fs.readFileSync( path.join( path.dirname( manifest ), 'manifest.json' ), {encoding: 'utf8'} ) );
			} catch ( e ) {
				reject( e );
				return;
			}
			runCommand( data.hostname[0], ['install', '--prefer-dist', '--no-progress'] )
				.then( fulfill, reject );
		} );
	}

	return maybeWriteManifest( manifest )
		.then( doInstall );
}

module.exports = {
	install: install
};
