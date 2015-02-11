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
 * Commands namespace.
 *
 * @type {Object}
 */
var commands = module.exports;

/**
 * Load up commands
 */
commands.version = require( './commands/version' );
commands.import = require( './commands/import' );
commands.create_db = require( './commands/create-db' );
commands.import_db = require( './commands/import-db' );
commands.export_db = require( './commands/export-db' );
commands.create_chain = require( './commands/create-chain' );
