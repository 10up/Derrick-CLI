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
var PassthruCommand = require( './passthru-command' ),
	composerCommand = new PassthruCommand( 'composer' );

/**
 * Convenience wrapper for the composer install command
 *
 * @param {String} directory
 * @returns {Promise}
 */
function install( directory ) {
	return composerCommand.command( directory, ['install', '--prefer-dist', '--no-progress', '--ignore-platform-reqs'] );
}

/**
 * Convenience wrapper for the composer update command
 *
 * @param {String} directory
 * @returns {Promise}
 */
function update( directory ) {
	return composerCommand.command( directory, ['update', '--prefer-stable', '--no-progress', '--ignore-platform-reqs'] );
}

/**
 * Actust any arguments passed along to Composer.
 *
 * @param {Array} args
 *
 * @returns {Array}
 */
composerCommand.adjustArgs = function ( args ) {
	var x,
		copy = args,
		slice = 1;
	for ( x = 0; x < args.length; x += 1 ) {
		if ( /^--path(=|$)/.test( args[x] ) ) {
			if ( args[x].length === 6 ) {
				slice = 2;
			}
			copy.splice( x, slice );
			break;
		}
	}
	return copy;
};

/**
 * Export the module.
 *
 * @type {Object}
 */
module.exports = {
	install : install,
	update  : update,
	_command: composerCommand.command
};