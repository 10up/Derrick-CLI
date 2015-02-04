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
var print = require( 'winston' ).cli(),
	command = require( '../command' ),
	NPromise = require( 'promise' ),
	Spinner = require( 'cli-spinner' ).Spinner,
	VM = require( '../vm' ),
	path = require( 'path' );

/**
 * Commands
 *
 * @type {Object}
 */
var commands = require( '../commands' );

/**
 * The application.
 *
 * @type {Object}
 */
var app = require( '../app' );

/**
 * Get a callback to import the specified SQL dump file into the named database.
 *
 * @param {String} db_name
 *
 * @returns {Function}
 */
function importDBCallback( db_name ) {
	"use strict";
	return function ( dump_file ) {
		// Global spinner for indicating import progress
		var spinner;
		dump_file = normalizePathForServer( dump_file );

		/**
		 * Kill the spinner so it doesn't run forever.
		 */
		function kill_spinner() {
			if ( undefined !== spinner ) {
				spinner.stop( true );
				spinner = undefined;
			}
		}

		return new NPromise( function ( fulfill, reject ) {
			var command_params = {
				"database": db_name,
				"dumpfile": dump_file
			};

			var com = command( 'import-db', command_params );

			com.on( 'progress', function ( data ) {
				if ( undefined !== data.log ) {
					kill_spinner();
					data.log[1] = 'Server - ' + data.log[1];
					print.log.apply( com, data.log );
				} else if ( undefined !== data.ping ) {
					if ( undefined === spinner ) {
						spinner = new Spinner( 'Importing database... %s' );
						spinner.setSpinnerString( '|/-\\' );
						spinner.start();
					}
				}

				// Clean up our events
				com.done( function ( data ) {
					kill_spinner();

					fulfill( data );
				}, reject );
			} );
		} );
	};
}

function normalizePathForServer( file ) {
	"use strict";
	var vm = new VM( process.cwd() ),
		rel = path.relative( vm.root, file ),
		server_root = '/vagrant/';
	return server_root + rel.replace( /\\+/g, '/' );
}

/**
 * Maybe download a remote sql file
 *
 * @param {String} file
 *
 * @returns {NPromise}
 */
function maybeDownloadFile( file ) {
	"use strict";
	if ( !/^https?:\/\//.test( file ) ) {
		return NPromise.resolve( file );
	}
	var download = require( '../download' ),
		temp = require( '../temp' );
	return download( file, temp.createWriteStream() );
}

/**
 * Imports a SQL file
 *
 * @param {String} db_name
 * @param {String} dump_file
 */
module.exports = commands.import_db = function ( db_name, dump_file ) {
	'use strict';
	var error = false;

	if ( undefined === db_name ) {
		print.error( 'You must define a database name!' );
		error = true;
	}

	if ( undefined === dump_file ) {
		print.error( 'You must specify a dump file.' );
		error = true;
	}

	if ( error ) {
		print.info( 'Aborting...' );
		process.exit( 1 );
		return;
	}

	print.log( 'info', 'Importing SQL dump into \'%s\'', db_name );

	return maybeDownloadFile( dump_file )
		.then( importDBCallback( db_name ) )
		.then( function () {
			print.info( 'All done!' );
		} );
};

/**
 * Route the command
 */
app.cmd( /import-db\s?([^\s]+)?\s?([^\s]+)?/, commands.import_db );
