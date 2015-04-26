'use strict';

var temp = require( 'temp' ),
	VM = require( './vm' ),
	path = require( 'path' ),
	fs = require( 'fs' );

temp.track();

if ( !fs.existsSync( path.join( VM( process.cwd() ).root, 'tmp' ) ) ) {
	require( 'mkdirp' ).sync( path.join( VM( process.cwd() ).root, 'tmp' ) );
	require( 'mkdirp' ).sync( path.join( VM( process.cwd() ).root, 'tmp' ) );
}

function getAffixes( affixes ) {
	var vm = VM( process.cwd() );

	affixes = affixes || {};
	if ( 'object' !== typeof affixes ) {
		affixes = {prefix: affixes};
	}
	affixes.dir = path.join( vm.root, 'tmp' );
	return affixes;
}

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
