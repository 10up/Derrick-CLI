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
var NPromise = require( 'promise' ),
	fs = require( 'fs' ),
	temp = require( './temp' );

/**
 * Resolver object.
 *
 * @type {resolveConfigFile}
 */
module.exports = resolveConfigFile;

/**
 * Resolve a configuration/manifest file
 *
 * @param {String} config
 * @returns {*}
 */
function resolveConfigFile( config ) {
	'use strict';
	return /^(https?):\/\//.test( config ) ?
		resolveRemoteConfigFile( config ) :
		resolveLocalConfigFile( config );
}

/**
 * Resolve a local configuration file.
 *
 * @param {String} config
 * @returns {NPromise}
 */
function resolveLocalConfigFile( config ) {
	'use strict';
	var fs = require( 'fs' );
	return new NPromise( function ( resolve, reject ) {
		fs.readFile( config, {encoding: 'utf8'}, function ( err, data ) {
			if ( err ) {
				reject( err );
			} else {
				resolve( data );
			}
		} );
	} );
}

/**
 * Resolve a remote configuration file.
 *
 * @param {String} config
 * @returns {NPromise}
 */
function resolveRemoteConfigFile( config ) {
	'use strict';
	var transport,
		url = require( 'url' ).parse( config ),
		opts;
	transport = require( url.protocol.replace( /:$/, '' ) );
	opts = {
		hostname: url.hostname,
		path    : url.path
	};
	if ( url.port ) {
		opts.port = url.port;
	}
	if ( url.auth ) {
		opts.auth = url.auth;
	}
	return (new NPromise( function ( resolve, reject ) {
		var tmpFile = temp.path(),
		//read = fs.createReadStream( tmpFile, {flags: 'wx+'} ),
			write = fs.createWriteStream( tmpFile, {flags: 'wx+'} ),
			request = transport.request( opts, function ( response ) {
				//response.setEncoding( 'utf8' );
				response.pipe( write );
				response.on( 'end', function () {
					resolve( tmpFile );
				} );
				response.on( 'error', reject );
			} );
		request.on( 'error', reject );
		request.end();
	} )).then( resolveLocalConfigFile );
}
