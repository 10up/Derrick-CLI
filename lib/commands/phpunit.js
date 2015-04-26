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

"use strict";

/**
 * Module dependencies.
 */
var PassthruCommand = require( './passthru-command' ),
	path = require( 'path' ),
	isAbsolute = require( 'path-is-absolute' ),
	VM = require( '../vm' );

function tweakConfiguration( argsList ) {
	var vm = VM( process.cwd() ),
		x,
		arg,
		configRegex = /^(-c|--configuration)(?:=(.*))?$/,
		match,
		config;
	for ( x = 0, arg = argsList[x]; x < argsList.length; x += 1, arg = argsList[x] ) {
		match = configRegex.exec( arg );
		if ( !match ) {
			continue;
		}
		config = match[2] ? match[2] : argsList[x + 1];
		if ( !isAbsolute( config ) ) {
			config = path.join( process.cwd(), config );
		}
		config = path.relative( vm.root, config ).replace( /\\+/g, '/' );
		if ( !match[2] ) {
			argsList.splice( x + 1, 1 );
		}
		argsList[x] = '--configuration=' + config;
		break;
	}
	return argsList;
}

function stripPathFromArgs( argsList ) {
	var x,
		pathPattern = /^--path(?:=(.+))?$/,
		match;
	for ( x = 0; x < argsList.length; x += 1 ) {
		match = pathPattern.exec( argsList[x] );
		if ( match ) {
			argsList.splice( x, match[1] ? 1 : 2 );
			break;
		}
	}
	return argsList;
}

/**
 * PHPUnit passthru command
 * @type {PassthruCommand}
 */
var phpunit = new PassthruCommand( 'phpunit', /phpunit(\s+.*)?/ );

phpunit.adjustArgs = function ( args ) {
	args = stripPathFromArgs( args );
	args = tweakConfiguration( args );
	return args;
};

module.exports = phpunit.command.bind( phpunit );
