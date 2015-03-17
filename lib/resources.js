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
	var pathType = this.type;
	switch ( this.type ) {
		case 'plugin':
			pathType = 'plugins';
			break;
		case 'theme':
			pathType = 'themes';
			break;
		case 'mu-plugin':
			pathType = 'mu-plugins';
			break;
		case 'dropin':
		case 'drop-in':
			pathType = 'dropins';
			break;
	}
	this.path = path.join( pathType, this.location );
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
	} else if ( 'plugin' === data.type ) {
		return new PluginRepoResource( data );
	} else if ( 'theme' === data.type ) {
		return new ThemeRepoResource( data );
	} else if ( /(\.tar(\.gz)?|\.zip)$/.test( url.parse( data.url ).pathname ) ) {
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
			unzip = require( 'unzip' ),
			download = require( './download' );

		function maybeDownloadResource() {
			if ( !/^https?:\/\//.test( that.url ) ) {
				return NPromise.resolve( that.url );
			}
			var suffix = fs.basename( that.url ).split( '.' ).splice( 1 ).join( '.' );
			return download( that.url, temp.createWriteStream( {suffix: suffix} ) );
		}

		function maybeUnzipResource( location ) {
			if ( '.gz' !== location.substr( -3 ) || '.zip' !== location.substr( -4 ) ) {
				return NPromise.resolve( location );
			}
			return new NPromise( function ( fulfill, nope ) {
				var unzipper = new unzip.Extract( {path: where} );
				unzipper.on( 'error', nope );
				unzipper.on( 'close', function () {
					fulfill( true );
				} );
				fs.createReadStream( location ).pipe( unzipper );
			} );
		}

		return maybeDownloadResource()
			.then( maybeUnzipResource, reject )
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

function WpRepoResource( info ) {
	"use strict";
	this.ensureUrl( info );
	ArchiveResource.call( this, info );
}

WpRepoResource.prototype = Object.create( ArchiveResource.prototype );
WpRepoResource.prototype.constructor = WpRepoResource;

/**
 * Ensure a url is present from the data available
 *
 * @param {Object} info
 */
WpRepoResource.prototype.ensureUrl = function ( info ) {
	"use strict";
	throw new Error( 'Subclass of WpRepoResource must implement ensureUrl', info );
};

function PluginRepoResource( info ) {
	"use strict";
	WpRepoResource.call( this, info );
}

PluginRepoResource.prototype = Object.create( WpRepoResource.prototype );
PluginRepoResource.prototype.constructor = PluginRepoResource;
PluginRepoResource.prototype.ensureUrl = function ( info ) {
	"use strict";
	if ( !info.url ) {
		info.url = 'https://downloads.wordpress.org/plugin/' + info.name;
		if ( info.reference ) {
			info.url += '.' + info.reference;
		}
		info.url += '.zip';
	}
};

function ThemeRepoResource( info ) {
	"use strict";
	WpRepoResource.call( this, info );
}

ThemeRepoResource.prototype = Object.create( WpRepoResource.prototype );
ThemeRepoResource.prototype.constructor = ThemeRepoResource;
ThemeRepoResource.prototype.ensureUrl = function ( info ) {
	"use strict";
	if ( !info.url ) {
		info.url = 'https://downloads.wordpress.org/theme/' + info.name;
		if ( info.reference ) {
			info.url += '.' + info.reference;
		}
		info.url += '.zip';
	}
};
