/**
 * Verify the functionality of the version module
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
	commandsStub = {},
	appStub = { cmd: function() {} },
	packageStub = { version: 'M.m.p' };

/**
 * Test suite for version command
 */
describe( 'version', function() {
	it( 'Should return the package.json version', function() {
		// Set up
		var level = '', data = '', passthru = '';
		winstonStub.cli = function() {
			return {
				'log': function( l, d, p ) {
					level = l;
					data = d;
					passthru = p;
				}
			};
		};

		// Module for testing
		var version = proxyquire(
			'../../lib/commands/version',
			{
				'winston': winstonStub,
				'../commands': commandsStub,
				'../app': appStub,
				'../../package.json': packageStub
			} );

		// Test
		commandsStub.version();

		// Verify
		assert.equal( 'info', level );
		assert.equal( 'version %s', data );
		assert.equal( 'M.m.p', passthru );
	} );

	it( 'Should register a version command', function() {
		// Setup
		var regex = '', callback = '';
		appStub.cmd = function( r, c ) {
			regex = r;
			callback = c;
		};

		// Module for testing
		var version = proxyquire(
			'../../lib/commands/version',
			{
				'winston': winstonStub,
				'../commands': commandsStub,
				'../app': appStub,
				'../../package.json': packageStub
			}
		);

		// Verify
		assert.equal( 0, regex.source.indexOf( 'version' ) );
		assert.strictEqual( commandsStub.version, callback );
	} );
} );