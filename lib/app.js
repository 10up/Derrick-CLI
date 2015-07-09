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
var flatiron = require( 'flatiron' );

/**
 * The application object.
 *
 * @type {Object}
 */
var app = module.exports = flatiron.app;

/**
 * Usage
 */
app.use( flatiron.plugins.cli, {
	usage: [
		'',
		'derrick',
		'',
		'Usage:',
		'  requirements                               - Verify sys requirements',
		'  global-status                              - List all installations',
		'  status                                     - List installation info',
		'  import [--satis <cache url>]               - Import a project',
		'  create                                     - Create a new project',
		'  create-db <db> <user> <pass>               - Create a database',
		'  import-db <db> <sql-dump>                  - Import a SQL dump',
		'  wp --project=<project-slug> <command>      - Execute wp commands',
		'  phpunit --project=<project-slug>           - Execute phpunit',
		'  export <project-slug>                      - Export a project',
		'  export-db <database>                       - Export a database',
		'',
		'Author: Eric Mann <eric.mann@10up.com>'
	]
} );