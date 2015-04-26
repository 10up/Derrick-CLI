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
var NPromise = require( 'promise' ),
	fs = require( 'fs' );

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
	return new NPromise( function ( resolve, reject ) {
		fs.readFile( config, {encoding: 'utf8'}, function ( err, data ) {
			if ( err ) {
				reject( err );
			} else {
				resolve( [data, config] );
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
	var temp = require( './temp' );

	return require( './download' )( config, temp.createWriteStream() ).then( resolveLocalConfigFile );
}
