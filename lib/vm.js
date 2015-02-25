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
var fs = require( 'fs' ),
	path = require( 'path'),
	print = require( 'winston' ).cli();

module.exports = VM;

/**
 * VM Object Constructor
 *
 * @param {String} directory
 * @returns {VM}
 * @constructor
 */
function VM( directory ) {
	'use strict';
	if ( this && this.constructor === VM ) {
		this.directory = directory;
		try {
			this.setup();
		} catch( exception ) {
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
	'use strict';
	var dir = this.directory;
	do {
		if ( fs.existsSync( path.join( dir, 'Vagrantfile' ) ) ) {
			this.root = dir;
			break;
		}
		if ( dir === path.dirname( dir ) ) {
			print.error( 'There is no Vagrantfile in this directory. Try changing directories to wherever Moonshine is located.' );
			throw new Error( 'Could not find Vagrantfile! ' + this.directory );
		}
		dir = path.dirname( dir );
	} while ( 1 );


};
