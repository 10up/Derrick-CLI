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
var print = require( 'winston' ).cli(),
	command = require( '../command' ),
	NPromise = require( 'promise' ),
	Spinner = require( 'cli-spinner' ).Spinner,
	VM = require( '../vm' ),
	path = require( 'path' ),
	fs = require( 'fs' ),
	zlib = require( 'zlib' );

/**
 * The application.
 *
 * @type {Object}
 */
var app = require( '../app' );

/**
 * Object wrapper
 *
 * @constructor
 */
function Command_ExportDB() {}

Command_ExportDB.prototype.run = function( db_name ) {
	var error = false;

	if ( undefined === db_name ) {
		print.error( 'You must define a database name!' );
		error = true;
	}

	if ( error ) {
		print.info( 'Aborting...' );
		process.exit( 1 );
		return;
	}

	print.log( 'info', 'Exporting dump file of \'%s\'', db_name );

	return this.maybeDumpDatabase( db_name )
		.then( this.compressDatabase );
};

/**
 * Make sure the file path is relative to the Vagrant installation.
 *
 * @param {String} file
 *
 * @returns {String}
 */
Command_ExportDB.prototype.normalizePathForServer = function( file ) {
	var vm = new VM( process.cwd() ),
		rel = path.relative( vm.root, file ),
		server_root = '/vagrant/';
	return server_root + rel.replace( /\\+/g, '/' );
};

/**
 * Attempt to connect to MySQL to export a database dumpfile.
 *
 * @param {String} db_name
 *
 * @returns {NPromise}
 */
Command_ExportDB.prototype.maybeDumpDatabase = function( db_name ) {
	var spinner,
		that = this,
		temp = require( '../temp');

	/**
	 * Kill the spinner so it doesn't run forever.
	 */
	var kill_spinner = function() {
		if ( undefined !== spinner ) {
			spinner.stop( true );
			spinner = undefined;
		}
	}

	return new NPromise( function( fulfill, reject ) {
		temp.mkdir( 'dump', function( err, dirPath ) {
			var dump_file = path.join( dirPath, db_name + '.sql' );

			var command_params = {
				"database": db_name,
				"dumpfile": that.normalizePathForServer( dump_file )
			};

			var com = command( 'export-db', command_params );

			com.on( 'progress', function( data ) {
				if ( undefined !== data.log ) {
					kill_spinner();
					data.log[1] = 'Server - ' + data.log[1];
					print.log.apply( com, data.log );
				} else if ( undefined !== data.ping ) {
					if ( undefined === spinner ) {
						spinner = new Spinner( 'Exporting database... %s' );
						spinner.setSpinnerString( '|/-\\' );
						spinner.start();
					}
				}

				// Clean up our events
				com.done( function() {
					kill_spinner();

					fulfill( [ dump_file, db_name ] );
				}, reject );
			} );
		} );
	} );
};

/**
 * Compress the freshly exported database file.
 *
 * @param {Array} args Array of dump_file, db_name
 *
 * @returns {NPromise}
 */
Command_ExportDB.prototype.compressDatabase = function( args ) {
	var dump_file = args[0],
		db_name = args[1];

	return new NPromise( function( fulfill ) {
		fs.readFile( dump_file, function( err, data ) {
			zlib.gzip( data, function( huh, buf ) {
				var date = new Date().toISOString().replace( 'T', '-' ).replace( /\..+/, '' ).replace( /\:/g, '-' );

				var filename = db_name + '-db-' + date + '.sql.gz';
				fs.writeFile( filename, buf, function() {
					print.log( 'info', 'Finished exporting database to %s', filename );

					fulfill( filename );
				} );
			} );
		} );
	} );
};

/**
 * Export a SQL database to a compressed file.
 *
 * @param {String} db_name
 */
module.exports = Command_ExportDB;

/**
 * Route the command
 */
app.cmd( /export-db\s?([^\s]+)?/, function( db_name ) {
	( new Command_ExportDB() ).run( db_name )
		.then( function() {
			print.info( 'All done! Cleaning up a few things...' );
			command.closeConnections();
		} );
} );