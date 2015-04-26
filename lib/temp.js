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
 * Module dependencies
 */
var temp = require( 'temp' ),
	vm = requite( './vm' )( process.cwd() ),
	path = require( 'path' ),
	fs = require( 'fs' );

temp.track();

if ( !fs.existsSync( path.join( vm.root, 'tmp' ) ) ) {
	require( 'mkdirp' ).sync( path.join( vm.root, 'tmp' ) );
	require( 'mkdirp' ).sync( path.join( vm.root, 'tmp' ) );
}

/**
 * Get available extra information. (This includes the directory and other details we need for file access.)
 *
 * @param {Object} affixes
 * @returns {Object}
 */
function getAffixes( affixes ) {
	affixes = affixes || {};
	if ( 'object' !== typeof affixes ) {
		affixes = {prefix: affixes};
	}
	affixes.dir = path.join( vm.root, 'tmp' );
	return affixes;
}

/**
 * Export our module.
 *
 * @type {Object}
 */
module.exports = {

	cleanup: temp.cleanup,

	cleanupSync: temp.cleanupSync,

	mkdir: function ( affixes, callback ) {
		temp.mkdir( getAffixes( affixes ), callback );
	},

	mkdirSync: function ( affixes ) {
		return temp.mkdirSync( getAffixes( affixes ) );
	},

	open: function ( affixes, callback ) {
		temp.open( getAffixes( affixes ), callback );
	},

	openSync: function ( affixes ) {
		return temp.openSync( getAffixes( affixes ) );
	},

	path: function ( affixes ) {
		return temp.path( getAffixes( affixes ) );
	},

	createWriteStream: function ( affixes ) {
		return temp.createWriteStream( getAffixes( affixes ) );
	}

};