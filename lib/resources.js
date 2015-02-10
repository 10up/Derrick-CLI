var path = require( 'path' ),
	url = require( 'url' ),
	NPromise = require( 'promise' ),
	print = require( 'winston' ).cli(),
	spawn = require( 'child_process' ).spawn;

module.exports = {

	Resource: Resource,

	VcsResource: VcsResource

};

function checkProp( obj, prop, type ) {
	"use strict";
	var exists = true,
		wrongType = false;
	try {
		if ( undefined === obj[prop] ) {
			exists = false;
		} else if ( type && type !== typeof obj[prop] ) {
			wrongType = typeof obj[prop];
		}
	} catch ( e ) {
		exists = false;
	}
	if ( !exists ) {
		throw new Error( prop + ' is a required field!' );
	}
	if ( wrongType ) {
		throw new Error( prop + ' must be a ' + type + '. Was a ' + wrongType + ' instead.' );
	}
}

function Resource( info ) {
	"use strict";
	if ( !info.location ) {
		info.location = '{name}';
	}
	checkProp( info, 'type', 'string' );
	checkProp( info, 'name', 'string' );
	this.type = info.type;
	this.name = info.name;
	this.reference = info.reference || '';
	this.url = this.url || info.url || '';
	this.location = path.normalize( info.location.replace( '{name}', this.name ) );
	this.path = path.join( this.type, this.location );
}

Resource.prototype.path = '';
Resource.prototype.name = '';
Resource.prototype.type = '';
Resource.prototype.location = '';
Resource.prototype.reference = '';
Resource.prototype.install = function ( where ) {
	"use strict";
	print.info( where );
};

Resource.newFromData = function ( data ) {
	"use strict";
	if ( 'wordpress' === data.type ) {
		return new WordPressResource( data );
	} else if ( data.vcs ) {
		return VcsResource.newFromVcs( data );
	} else if ( /\.tar(\.gz)?$/.test( url.parse( data.url ).pathname ) ) {
		return new ArchiveResource( data );
	}
	return new Resource( data );
};

function VcsResource( info ) {
	"use strict";
	if ( this.constructor === VcsResource ) {
		throw new Error( 'This is an abstract class!' );
	}
	checkProp( info, 'url', 'string' );
	if ( !info.vcs || 'svn' !== info.vcs ) {
		info.vcs = 'git';
	}
	if ( !info.name ) {
		info.name = path.basename( info.url, '.' + info.vcs );
	}
	this.url = info.url;
	this.vcs = info.vcs;
	this.ref = info.ref || '';
	Resource.call( this, info );
}

VcsResource.prototype = Object.create( Resource.prototype );
VcsResource.prototype.constructor = VcsResource;
VcsResource.prototype.url = '';
VcsResource.prototype.vcs = '';
VcsResource.prototype.ref = '';
VcsResource.prototype.install = function ( where ) {
	"use strict";
	return NPromise.resolve( where );
};
VcsResource.newFromVcs = function ( info ) {
	"use strict";
	var resource;
	info.vcs = info.vcs || 'git';
	switch ( info.vcs ) {
		case 'git':
			resource = new GitResource( info );
			break;
		case 'svn':
			resource = new SvnResource( info );
			break;
		default:
			throw new Error( 'invalid vcs type!' );
	}
	return resource;
};

function GitResource( info ) {
	"use strict";
	info.ref = info.ref || 'master';
	VcsResource.call( this, info );
}

GitResource.prototype = Object.create( VcsResource.prototype );
GitResource.prototype.constructor = GitResource;
GitResource.prototype.install = function ( where ) {
	"use strict";
	var that = this;
	return new NPromise( function ( resolve, reject ) {
		var clone = spawn( 'git', ['clone', '-q', that.url, where], {stdio: 'inherit'} );
		clone.on( 'error', reject );
		clone.on( 'close', function ( code ) {
			if ( code > 0 ) {
				reject( 'Git exited with non-zero code!' );
			} else {
				resolve( true );
			}
		} );
	} );
};

function SvnResource( info ) {
	"use strict";
	info.ref = undefined === info.ref ? 'trunk' : info.ref;
	VcsResource.call( this, info );
}

SvnResource.prototype = Object.create( VcsResource.prototype );
SvnResource.prototype.constructor = SvnResource;
SvnResource.prototype.install = function ( where ) {
	"use strict";
	var that = this;
	return new NPromise( function ( resolve, reject ) {
		var checkout = spawn( 'svn', ['checkout', '-q', that.url, where], {stdio: 'inherit'} );
		checkout.on( 'error', reject );
		checkout.on( 'close', function ( code ) {
			if ( code > 0 ) {
				reject( 'SVN exited with non-zero code!' );
			} else {
				resolve( true );
			}
		} );
	} );
};

function ArchiveResource( info ) {
	"use strict";
	Resource.call( this, info );
}

ArchiveResource.prototype = Object.create( Resource.prototype );
ArchiveResource.prototype.constructor = ArchiveResource;
ArchiveResource.prototype.install = function ( where ) {
	"use strict";
	var that = this;
	return new NPromise( function ( resolve, reject ) {
		var temp = require( 'temp' ),
			fs = require( 'fs' ),
			zlib = require( 'zlib' ),
			tar = require( 'tar' ),
			download = require( './download' );

		function maybeDownloadResource() {
			if ( !/^https?:\/\//.test( that.url ) ) {
				return NPromise.resolve( that.url );
			}
			var suffix = /\.tar\.gz/.test( that.url ) ? '.tar.gz' : '.tar';
			return download( that.url, temp.createWriteStream( {suffix: suffix} ) );
		}

		function maybeUnzipResource( location ) {
			if ( '.gz' !== location.substr( -3 ) ) {
				return NPromise.resolve( location );
			}
			return new NPromise( function ( fulfill, nope ) {
				var target = temp.createWriteStream( {suffix: '.tar'} ),
					unzip = zlib.createUnzip();
				target.on( 'finish', function () {
					fulfill( target.path );
				} );
				target.on( 'error', nope );
				unzip.on( 'error', nope );
				fs.createReadStream( location ).pipe( unzip ).pipe( target );
			} );
		}

		function unpackResource( location ) {
			return new NPromise( function ( fulfill, nope ) {
				var extract = tar.Extract( {path: where, strip: 1} )
					.on( 'error', nope )
					.on( 'end', function () {
						fulfill( true );
					} );
				fs.createReadStream( location )
					.on( 'error', nope )
					.pipe( extract );
			} );
		}

		return maybeDownloadResource()
			.then( maybeUnzipResource, reject )
			.then( unpackResource, reject )
			.then( resolve, reject );
	} );
};

function WordPressResource( info ) {
	"use strict";
	ArchiveResource.call( this, info );
	this.path = 'wordpress';
	this.location = 'wordpress';
}

WordPressResource.prototype = Object.create( ArchiveResource.prototype );
WordPressResource.prototype.constructor = WordPressResource;
