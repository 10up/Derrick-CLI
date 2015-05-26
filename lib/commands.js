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
 * Commands namespace.
 *
 * @type {Object}
 */
var commands = module.exports,
	importCommand = require( './commands/import' );

/**
 * Load up commands
 */
commands.version = require( './commands/version' );
commands.import_file = importCommand.import_file;
commands.import_json = importCommand.import_json;
commands.create = require( './commands/create' );
commands.create_db = require( './commands/create-db' ).run;
commands.import_db = require( './commands/import-db' );
commands.export_db = require( './commands/export-db' );
commands.create_chain = require( './commands/create-chain' );
commands.export = require( './commands/export' );
commands.composer = require( './commands/composer' );
commands.wp = require( './commands/wp' );
commands.phpunit = require( './commands/phpunit' );
commands.status = require( './commands/status' );
commands.globalstatus = require( './commands/global-status' );