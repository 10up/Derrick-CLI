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
var print = require( 'winston' ).cli(),
	pkg = require( '../../package.json' );

/**
 * Commands
 *
 * @type {Object}
 */
var commands = require( '../commands' );

/**
 * The application.
 *
 * @type {Object}
 */
var app = require( '../app' );

/**
 * Prints the current version.
 *
 * @api public
 */
commands.version = function () {
	print.log( 'info', 'version %s', pkg.version );
};

/**
 * Route the command
 */
app.cmd( /version/, commands.version );