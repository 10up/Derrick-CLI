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
var path = require( 'path' );

/**
 * The application object
 *
 * @type {Object}
 */
var app = module.exports = require( './app' );

/**
 * Commands
 *
 * @type {Object}
 */
var commands = require( './commands' );