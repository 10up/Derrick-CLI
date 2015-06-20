/**
 * Verify the behavior of the database creation routine.
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

/**
 * Test suite for the create DB command
 */
describe( 'create-db', function() {
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
			var createDB = proxyquire(
				'../../lib/commands/create-db',
				{
					'winston': winstonStub,
					'../commands': commandsStub,
					'../app': appStub,
				}
			);
			(new createDB()).run( undefined, '', '' );

			// Verify
			assert.equal( 1, errors.length );
			assert.equal( 'You must define a database name!', errors[0] );
			assert.equal( 1, info.length );
			assert.equal( 'Aborting...', info[0] );

			// Reset
			process.exit = _exit;
		} );

		it( 'Should require username', function() {
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
			var createDB = proxyquire(
				'../../lib/commands/create-db',
				{
					'winston': winstonStub,
					'../commands': commandsStub,
					'../app': appStub
				}
			);
			(new createDB()).run( '', undefined, '' );

			// Verify
			assert.equal( 1, errors.length );
			assert.equal( 'You must define a database username!', errors[0] );
			assert.equal( 1, info.length );
			assert.equal( 'Aborting...', info[0] );

			// Reset
			process.exit = _exit;
		} );

		it( 'Should require password', function() {
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
			var createDB = proxyquire(
				'../../lib/commands/create-db',
				{
					'winston': winstonStub,
					'../commands': commandsStub,
					'../app': appStub,
				}
			);
			(new createDB()).run( '', '', undefined );

			// Verify
			assert.equal( 1, errors.length );
			assert.equal( 'You must define a database password!', errors[0] );
			assert.equal( 1, info.length );
			assert.equal( 'Aborting...', info[0] );

			// Reset
			process.exit = _exit;
		} );

		it( 'Creates a database', function() {
			// Setup
			var database = '', username = '', password = '';
			var log = '';
			winstonStub.cli = function() {
				return {
					'log': function( level, message, params ) {
						log = [ level, message, params ].join( ',' );
					}
				};
			};

			// Test
			var CreateDB = proxyquire(
					'../../lib/commands/create-db',
					{
						'winston'    : winstonStub,
						'../commands': commandsStub,
						'../app'     : appStub,
					}
				),
				createDB = new CreateDB();

			createDB.createDatabase = function( d, u, p ) {
				database = d;
				username = u;
				password = p;
			};
			createDB.run( 'testdb', 'testuser', 'testpass' );

			// Verify
			assert.equal( 'info,Creating database: %s,testdb', log );
			assert.equal( 'testdb', database );
			assert.equal( 'testuser', username );
			assert.equal( 'testpass', password );
		} );
	} );

	describe( 'createDatabase', function() {
		it( 'Should invoke create-db on server', function( done ) {
			// Setup
			var command = '', params ='';
			commandStub = function( c, p ) {
				command = c;
				params = p;

				return {
					on: function( event, callback ) {},
					done: function( callback ) { callback(); }
				};
			};

			// Test
			var createDB = proxyquire(
					'../../lib/commands/create-db',
					{
						'winston'    : winstonStub,
						'../commands': commandsStub,
						'../app'     : appStub,
						'../command' : commandStub,
						'promise'    : promiseStub
					}
				),
				databaseCallback = ( new createDB() ).createDatabase( 'test', 'test', 'test' );

			// Verify - Since the createDatabase command is a promise, we pass our tests through to the fulfill() method in our stub Promise object
			databaseCallback( function() {
				assert.equal( 'create-db', command );
				assert.deepEqual( { 'database': 'test', 'username': 'test', 'password': 'test' }, params );

				done();
			} );
		} );

		it( 'Should react to progress events from the server', function( done ) {
			// Setup
			var command = '', params ='', progress = false;
			commandStub = function( c, p ) {
				command = c;
				params = p;

				return {
					on: function( event, callback ) {
						if ( 'progress' === event ) {
							progress = true;
						}
					},
					done: function( callback ) { callback(); }
				};
			};

			// Test
			var createDB = proxyquire(
					'../../lib/commands/create-db',
					{
						'winston'    : winstonStub,
						'../commands': commandsStub,
						'../app'     : appStub,
						'../command' : commandStub,
						'promise'    : promiseStub
					}
				),
				databaseCallback = ( new createDB() ).createDatabase( 'test', 'test', 'test' );

			// Verify
			databaseCallback( function() {
				assert.ok( progress );

				done();
			} );
		} );

		it( 'Should truncate the database name', function( done ) {
			// Setup
			var command = '', params ='';
			commandStub = function( c, p ) {
				command = c;
				params = p;

				return {
					on: function( event, callback ) {},
					done: function( callback ) { callback(); }
				};
			};

			// Test
			var createDB = proxyquire(
					'../../lib/commands/create-db',
					{
						'winston'    : winstonStub,
						'../commands': commandsStub,
						'../app'     : appStub,
						'../command' : commandStub,
						'promise'    : promiseStub
					}
				),
				databaseCallback = ( new createDB() ).createDatabase( '0123456789ABCDEFG', 'test', 'test' );

			// Verify - Since the createDatabase command is a promise, we pass our tests through to the fulfill() method in our stub Promise object
			databaseCallback( function() {
				assert.equal( 'create-db', command );
				assert.deepEqual( { 'database': '0123456789ABCDEF', 'username': 'test', 'password': 'test' }, params );

				done();
			} );
		} );
	} );

	it( 'Should register a create-db command', function() {
		// Setup
		var regex = '', callback = '';
		appStub.cmd = function( r, c ) {
			regex = r;
			callback = c;
		};

		// Test
		var createDB = proxyquire(
			'../../lib/commands/create-db',
			{
				'winston': winstonStub,
				'../commands': commandsStub,
				'../app': appStub
			}
		);

		// Verify
		assert.equal( 0, regex.source.indexOf( 'create-db' ) );
		assert.equal( 'function', typeof callback );
	} );
} );