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
 * Module dependencies
 */
var winston = require( 'winston' );

/**
 * Commands namespace.
 *
 * @type {Object}
 */
var commands = module.exports;

/**
 * The application.
 *
 * @type {Object}
 */
var app = require( './app' );

/**
 * Prints the current version.
 *
 * @api public
 */
commands.version = function() {
	app.log.info( require( '../package.json' ).version );
}