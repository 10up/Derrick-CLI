var fs = require( 'fs' ),
	path = require( 'path' );

module.exports = VM;

function VM( directory ) {
	'use strict';
	if ( this.constructor === VM ) {
		this.directory = directory;
		this.setup();
	} else {
		return new VM( directory );
	}
}

VM.prototype.directory = '';

VM.prototype.root = '';

VM.prototype.setup = function () {
	'use strict';
	var dir = this.directory;
	do {
		if ( fs.existsSync( path.join( dir, 'Vagrantfile' ) ) ) {
			this.root = dir;
			break;
		}
		if ( dir === path.dirname( dir ) ) {
			throw new Error( 'Could not find Vagrantfile! ' + this.directory );
		}
		dir = path.dirname( dir );
	} while ( 1 );
};
