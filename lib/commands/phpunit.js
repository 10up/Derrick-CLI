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

"use strict";

/**
 * Module dependencies.
 */
var PassthruCommand = require( './passthru-command' ),
	path = require( 'path' ),
	isAbsolute = require( 'path-is-absolute' ),
	vm = require( '../vm' )( process.cwd() );

/**
 * Override the normal command for passthru so we can manipulate the args
 * We need to make sure there's a configuration file set. We can't know what
 * directory we'll be in or which project has the tests that need to be run
 * so this lets us make a guess
 *
 * @param {String} url
 * @param {String} extraArgs
 * @param {Array} rawArgs
 * @returns {*} Returns a promise object
 */
function phpunitCommand( url, extraArgs, rawArgs ) {
	rawArgs = process.argv.slice( 3 ); // node moonshine phpunit is 3 arguments to strip
	rawArgs = tweakConfiguration( rawArgs );
	rawArgs = stripUrlFromArgs( rawArgs );
	extraArgs = rawArgs.join( ' ' );
	return PassthruCommand.prototype.command.call( this, url, extraArgs, rawArgs );
}

function tweakConfiguration( argsList ) {
	var x,
		arg,
		configRegex = /^(-c|--configuration)(?:=(.*))?$/,
		match,
		config,
		foundConfig = false;
	for ( x = 0, arg = argsList[x]; x < argsList.length; x += 1, arg = argsList[x] ) {
		match = configRegex.exec( arg );
		if ( !match ) {
			continue;
		}
		foundConfig = true;
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
	if ( !foundConfig ) {
		argsList.unshift( '--configuration=' + path.relative( vm.root, process.cwd() ).replace( /\\+/g, '/' ) );
	}
	return argsList;
}

function stripPathFromArgs( argsList ) {
	var x,
		copy = argsList,
		slice = 1;
	for ( x = 0; x < argsList.length; x += 1 ) {
		if ( /^--path(=|$)/.test( argsList[x] ) ) {
			if ( argsList[x].length === 6 ) {
				slice = 2;
			}
			copy.splice( x, slice );
			break;
		}
	}
	return copy;
}

/**
 * PHPUnit passthru command
 * @type {PassthruCommand}
 */
var phpunit = new PassthruCommand( 'phpunit', /phpunit(\s+.*)?/ );

phpunit.command = phpunitCommand.bind( phpunit );

module.exports = phpunit.command.bind( phpunit );
