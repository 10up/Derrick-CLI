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
var commands = module.exports;

/**
 * Module dependencies
 */
var importCommand = require( './commands/import' ),
	Command_CreateDB = require( './commands/create-db' ),
	Command_ExportDB = require( './commands/export-db' );

/**
 * Load up commands
 */
commands.version = require( './commands/version' );
commands.import_file = importCommand.import_file;
commands.import_json = importCommand.import_json;
commands.create = require( './commands/create' );
commands.create_db = function( db, name, password ) { var c = new Command_CreateDB(); return c.run( db, name, password ); };
commands.import_db = require( './commands/import-db' ).run;
commands.export_db = function( db ) { var c = new Command_ExportDB(); return c.run( db ); };
commands.create_chain = require( './commands/create-chain' );
commands.export = require( './commands/export' );
commands.composer = require( './commands/composer' );
commands.wp = require( './commands/wp' );
commands.phpunit = require( './commands/phpunit' );
commands.status = require( './commands/status' );
commands.globalstatus = require( './commands/global-status' );