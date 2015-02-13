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
	NPromise = require( 'promise' ),
	command = require( '../command' );

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
 * Maim module function
 *
 * @param {String} args_string
 * @returns {NPromise}
 */
function wp( args_string ) {
	"use strict";
	return new NPromise( function ( fulfill ) {
		fulfill( args_string );
	} );
}

/**
 * Export the module
 */
module.exports = commands.wp = wp;

app.cmd( /wp\s?(.+)?/, function ( extra_args ) {
	"use strict";
	commands.create_chain( extra_args )
		.then( function () {
			print.info( 'All done!' );
			command.closeConnections();
		}, function ( err ) {
			print.error( err );
			command.closeConnections();
			process.exit( 1 );
		} );
} );
