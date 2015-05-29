/**
 * Verify the behavior of the database import routine
 */

/**
 * Test dependencies
 */
var proxyquire = require( 'proxyquire' ).noCallThru(),
	assert = require( 'assert' );

/**
 * Module dependencies
 */
var winstonStub = { cli: function() { return { log: function() {} }; } },
	commandStub = {},
	promiseStub = function( callback ) { return callback; },
	commandsStub = {},
	VMStub = {},
	tempStub = { createWriteStream: function() {} },
	appStub = { cmd: function() {} };

/**
 * Test suite for the import DB command
 */
describe( 'import-db', function() {
	describe( 'run', function() {
		it( 'Should require db_name and dump_file', function() {
			// Setup
			var _exit = process.exit;
			process.exit = function() {};
			var errors = [], info = [];
			
			winstonStub.cli = function() {
				return {
					'error': function( message, meta ) {
						errors.push( meta.code );
					},
					'info': function( message ) {
						info.push( message );
					}
				};
			};

			// Test
			var importDB = proxyquire(
				'../../lib/commands/import-db',
				{
					'winston': winstonStub,
					'../commands': commandsStub,
					'../app': appStub,
					'../vm': VMStub
				}
			);
			
			importDB.run( '', '' );

			// Verify first error has code 1 (no db_name)
			assert.equal( errors[0], 1 );

			// Verify first error has code 2 (no dump_file)
			assert.equal( errors[1], 2 );

			// Reset
			process.exit = _exit;
		} );
	} );

	describe( 'maybeDownloadFile', function() {
		it( 'Should download remote file', function() {
			var _exit = process.exit;
			process.exit = function() {};
			var errors = [], info = [];
			
			winstonStub.cli = function() {
				return {
					'error': function( message, meta ) {
						errors.push( meta.code );
					},
					'info': function( message ) {
						info.push( message );
					}
				};
			};

			var startDownload = false;

			var downloadStub = function() {
				startDownload = true;
			};
				
			var importDB = proxyquire(
				'../../lib/commands/import-db',
				{
					'winston': winstonStub,
					'../commands': commandsStub,
					'../app': appStub,
					'../download': downloadStub,
					'../temp': tempStub
				}
			);

			importDB.maybeDownloadFile( 'http://google.com' );

			// URL should not be downloaded
			assert.equal( startDownload, true );

			// Reset
			process.exit = _exit;

		} );

		it( 'Should not download local file', function() {
			var _exit = process.exit;
			process.exit = function() {};
			var errors = [], info = [];
			
			winstonStub.cli = function() {
				return {
					'error': function( message, meta ) {
						errors.push( meta.code );
					},
					'info': function( message ) {
						info.push( message );
					}
				};
			};

			var startDownload = false;

			var downloadStub = function() {
				startDownload = true;
			};
				
			var importDB = proxyquire(
				'../../lib/commands/import-db',
				{
					'winston': winstonStub,
					'../commands': commandsStub,
					'../app': appStub,
					'../download': downloadStub,
					'../temp': tempStub
				}
			);

			importDB.maybeDownloadFile( 'test.log' );

			// File should be downloaded
			assert.equal( startDownload, false );

			// Reset
			process.exit = _exit;

		} );
	} );
} );