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
var PassthruCommand = require( './passthru-command' );

/**
 * WP passthru command
 * @type {PassthruCommand}
 */
var wp = new PassthruCommand( 'wp' );

/**
 * Export the command.
 *
 * @type {Object}
 */
module.exports = wp.command.bind( wp );