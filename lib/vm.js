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
var fs = require( 'fs' ),
	path = require( 'path' ),
	print = require( 'winston' ).cli(),
	NPromise = require( 'promise' ),
	spawn = require( 'child_process' ).spawn;

/**
 * VM Object Constructor
 *
 * @param {String} directory
 * @returns {VM}
 * @constructor
 */
function VM( directory ) {
	if ( this && this.constructor === VM ) {
		this.directory = directory;
		try {
			this.setup();
		} catch ( exception ) {
			process.exit( 1 );
		}
	} else {
		return new VM( directory );
	}
}

/**
 * Directory reference.
 *
 * @type {string}
 */
VM.prototype.directory = '';

/**
 * Root directory reference.
 *
 * @type {string}
 */
VM.prototype.root = '';

/**
 * Set up the object
 */
VM.prototype.setup = function () {
	var dir = this.directory;
	do {
		if ( fs.existsSync( path.join( dir, 'Vagrantfile' ) ) ) {
			this.root = dir;
			break;
		}
		if ( dir === path.dirname( dir ) ) {
			print.error( 'There is no Vagrantfile in this directory. Try changing directories to wherever Derrick is located.' );
			throw new Error( 'Could not find Vagrantfile! ' + this.directory );
		}
		dir = path.dirname( dir );
	} while ( 1 );


};

/**
 * Attempt to start Vagrant if necessary.
 *
 * @returns {NPromise}
 */
VM.prototype.start = function () {
	var root = this.root;
	return new NPromise( function ( fulfill, reject ) {
		print.info( 'Trying to bring up vagrant...' );
		var up = spawn( 'vagrant', ['up'], {cwd: root, stdio: 'inherit'} );
		up.on( 'error', reject );
		up.on( 'close', function ( code ) {
			if ( code !== 0 ) {
				return reject( 'Vagrant exited with a non-zero status!' );
			}
			fulfill( true );
		} );
	} );
};

/**
 * Export our reusable VM access layer.
 *
 * @type {VM}
 */
module.exports = VM;