var parseArgs = require( 'minimist' ),
	util = require( 'util' ),
	commands = {
		list  : 'List all commands',
		help  : 'Show this help text',
		import: 'Import a project'
	};

module.exports = doCommand;

/**
 * Handle a command
 *
 * @param {array} args
 */
function doCommand( args ) {
	'use strict';
	var parsed = parseArgs( args, {boolean: true, alias: {h: 'help', l: 'list'}} ),
		cmd,
		helpText = [],
		sub,
		pkg;
	if ( parsed.help ) {
		cmd = 'help';
	} else if ( parsed.list ) {
		cmd = 'list';
	} else {
		cmd = parsed._ && parsed._.length ? parsed._[0] : 'help';
	}
	if ( ! commands[cmd] ) {
		cmd = 'help';
	}

	switch ( cmd ) {
		case 'help':
			pkg = require( '../package.json' );
			helpText = [
				util.format( 'moonshine v%s', pkg.version ),
				util.format( 'copyright (c) 10up, Inc. %d', (new Date()).getFullYear() ),
				'',
				'Use moonshine to set up projects in a local environment',
				'tailored to match production environments',
				'',
				'The following commands are available:'
			];
			for ( sub in commands ) {
				if ( commands.hasOwnProperty( sub ) ) {
					helpText.push( util.format( '  %s %s', (sub + '        ').slice( 0, 8 ), commands[sub] ) );
				}
			}
			console.log( helpText.join( '\n' ) );
			break;
		case 'list':
			for ( sub in commands ) {
				if ( commands.hasOwnProperty( sub ) ) {
					helpText.push( util.format( '%s %s', (sub + '        ').slice( 0, 8 ), commands[sub] ) );
				}
			}
			console.log( helpText.join( '\n' ) );
			break;
		case 'import':
			require( './' ).import( parsed._[1] );
			break;
	}
}
