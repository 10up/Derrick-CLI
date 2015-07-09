/*!
 * Derrick CLI
 *
 * 10up <sales@10up.com>
 * John Bloch <john.bloch@10up.com>
 * Eric Mann <eric.mann@10up.com>
 * Luke Woodward <luke.woodward@10up.com>
 * Taylor Lovett <taylor.lovett@10up.com>
 *
 * MIT License.
 */

'use strict';

/**
 * Module dependencies.
 */
var PassthruCommand = require( './passthru-command' );

/**
 * Export the command.
 *
 * @type {Object}
 */
module.exports = new PassthruCommand( 'wp' );