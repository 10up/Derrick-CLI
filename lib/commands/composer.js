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

"use strict";

/**
 * Module dependencies.
 */
var PassthruCommand = require( './commands/passthru-command' ),
	composerCommand;

function install( directory ) {
	return composerCommand.command( directory, ['install', '--prefer-dist', '--no-progress', '--ignore-platform-reqs'] );
}

function update( directory ) {
	return composerCommand.command( directory, ['update', '--prefer-stable', '--no-progress', '--ignore-platform-reqs'] );
}

composerCommand = new PassthruCommand( 'composer' );

module.exports = {
	install : install,
	update: update,
	_command: composerCommand.command
};
