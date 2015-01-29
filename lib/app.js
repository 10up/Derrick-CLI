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
var flatiron = require( 'flatiron' );

/**
 * The application object.
 *
 * @type {Object}
 */
var app = module.exports = flatiron.app;

// Usage
app.use( flatiron.plugins.cli, {
	usage: [
		'',
		'moonshine',
		'',
		'Usage:',
		'  import                               - Import a project manifest',
		'  create-db <db> <username> <password> - Create a database',
		'  import-db <db> <sql-dump>            - Import a SQL dump',
		'  wp --url=<siteurl> <commands>        - Execute wp commands',
		'  phpunit --url=<siteurl>              - Execute phpunit',
		'  export --url=<siteurl>               - Export a project',
		'  export-db <database>                 - Export a database',
		'',
		'Author: Eric Mann <eric.mann@10up.com'
	]
} );