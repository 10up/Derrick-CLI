/**
 * Verify the behavior of the database export routine.
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
	appStub = { cmd: function() {} };

describe( 'export-db', function() {
	describe( 'run', function() {
		it( 'Should require db_name', function() {
			// Setup
			var _exit = process.exit;
			process.exit = function() {};
			var errors = [], info = [];
			winstonStub.cli = function() {
				return {
					'error': function( message ) {
						errors.push( message );
					},
					'info': function( message ) {
						info.push( message );
					}
				};
			};

			// Test
			var exportDB = proxyquire(
				'../../lib/commands/export-db',
				{
					'winston': winstonStub
				}
			);
			(new exportDB()).run( undefined );

			// Verify
			assert.equal( 1, errors.length );
			assert.equal( 'You must define a database name!', errors[0] );
			assert.equal( 1, info.length );
			assert.equal( 'Aborting...', info[0] );

			// Reset
			process.exit = _exit;
		} );

		it( 'Should export a database' );
	} );

	describe( 'normalizePathForServer', function() {
		it ( 'Should converte a relative path' );
	} );

	describe( 'maybeDumpDatabase', function() {
		it( 'Should export the database' );
	} );

	describe( 'compressDatabase', function() {
		it( 'Should create a file named for the database' );

		it( 'Should compress the database' );
	} );

	it( 'Should register an export-db command', function() {
		// Setup
		var regex = '', callback = '';
		appStub.cmd = function( r, c ) {
			regex = r;
			callback = c;
		};

		// Test
		var exportDB = proxyquire(
			'../../lib/commands/export-db',
			{
				'winston': winstonStub,
				'../commands': commandsStub,
				'../app': appStub,
			}
		);

		// Verify
		assert.equal( 0, regex.source.indexOf( 'export-db' ) );
		assert.equal( 'function', typeof callback );
	} );
} );