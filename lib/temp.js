var temp = require( 'temp' ),
	vm = require( './vm' )( process.cwd() ),
	path = require( 'path' ),
	fs = require( 'fs' );

temp.track();

if ( !fs.existsSync( path.join( vm.root, 'tmp' ) ) ) {
	require( 'mkdirp' ).sync( path.join( vm.root, 'tmp' ) );
}

function getAffixes( affixes ) {
	"use strict";
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
		"use strict";
		temp.mkdir( getAffixes( affixes ), callback );
	},

	mkdirSync: function ( affixes ) {
		"use strict";
		return temp.mkdirSync( getAffixes( affixes ) );
	},

	open: function ( affixes, callback ) {
		"use strict";
		temp.open( getAffixes( affixes ), callback );
	},

	openSync: function ( affixes ) {
		"use strict";
		return temp.openSync( getAffixes( affixes ) );
	},

	path: function ( affixes ) {
		"use strict";
		return temp.path( getAffixes( affixes ) );
	},

	createWriteStream: function ( affixes ) {
		"use strict";
		return temp.createWriteStream( getAffixes( affixes ) );
	}

};
