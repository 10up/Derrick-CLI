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
var PassthruCommand = require( './passthru-command' );

/**
 * PHPUnit passthru command
 * @type {PassthruCommand}
 */
var phpunit = new PassthruCommand( 'phpunit', /phpunit(\s+.*)?/ );

module.exports = phpunit.command.bind( phpunit );
