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
var NPromise = require( 'promise' );

/**
 * Util namespace.
 *
 * @type {Object}
 */
var util = module.exports;

/**
 * Clear out the progress indicator
 */
util.clearLine = function() {
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
};

/**
 * Make the child_process spawn routine Promise-ready
 *
 * @param {String} command
 * @param {Array} args
 * @param {Undefined|Boolean} verbose
 * @returns {NPromise}
 */
util.spawn_command = function( command, args, verbose ) {
	if ( undefined === verbose ) {
		verbose = false;
	}

	var spawn = require( 'child_process' ).spawn,
		child_process = spawn( command, args );

	verbose && child_process.stdout.on( 'data', function( data ) { process.stdout.write( data ); } );
	child_process.stderr.on( 'data', function( data ) { process.stderr.write( data ); } );

	return new NPromise( function( fulfill, reject ) {
		child_process.on( 'exit', fulfill );
	} );
};

/**
 * Make the child_process exec routine Promise-ready
 *
 * @param {String} command
 * @param {Undefined|Boolean} verbose
 * @returns {NPromise}
 */
util.exec_command = function( command, verbose ) {
	if ( undefined === verbose ) {
		verbose = false;
	}

	var exec = require( 'child_process' ).exec,
		child_process = exec( command, function( error, stdout, stderr ) {
			verbose && stdout && process.stdout.write( stdout );
			stderr && process.stderr.write( stderr );
		} );

	return new NPromise( function( fulfill, reject ) {
		child_process.on( 'close', fulfill );
	} );
};