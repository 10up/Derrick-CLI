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
var print = require( 'winston' ).cli(),
	util = require( '../util' ),
	exec = require( 'child_process' ).exec,
	compareVersion = require( 'compare-version' ),
	NPromise = require( 'promise' );

// Make sure Winston allows us to fire errors
print.exitOnError = false;

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
 * Convert non-standard version strings to something we can compare to.
 *
 * @param {String} raw
 *
 * @returns {String}
 */
function parseVersion( raw ) {
	return raw.replace( /[^\d|^\.]/g, '' );
}

function checkPHP() {
	return new NPromise( function( fulfill, reject ) {
		var process = exec( 'php -v', function( error, stdout, stderr ) {
			if ( error ) {
				print.log( 'error', 'No installation of PHP is detected!' );
			} else {
				var regex = /PHP (\d\.\d\.\d*) \(cli\)/,
					phpVer = stdout.match( regex )[1],
					minRequired = '5.4';

				if ( compareVersion( minRequired, phpVer ) > 0 ) {
					print.log( 'error', 'PHP v%s is installed. You need at least v%s!', phpVer, minRequired );
				} else {
					print.log( 'info', 'PHP v%s looks good!', phpVer );
				}
			}
		} );

		process.on( 'close', fulfill );
	} );
}

/**
 * Check that Composer exists. We don't really care which version it is.
 *
 * @returns {NPromise}
 */
function checkComposer() {
	return new NPromise( function( fulfill, reject ) {
		var process = exec( 'composer --version', function( error, stdout, stderr ) {
			if ( error ) {
				print.log( 'error', 'No installation of Composer is detected!' );
			} else {
				print.log( 'info', 'Composer looks good!' );
			}
		} );

		process.on( 'close', fulfill );
	} );
}

/**
 * Ensure we're running the right version of Vagrant.
 *
 * @returns {NPromise}
 */
function checkVagrant() {
	return new NPromise( function( fulfill, reject ) {
		var process = exec( 'vagrant -v', function( error, stdout, stderr ) {
			if ( error ) {
				print.log( 'error', 'No installation of Vagrant is detected!' );
			} else {
				var vagrantVer = parseVersion( stdout ),
					minRequired = '1.7.2';

				if ( compareVersion( minRequired, vagrantVer ) > 0 ) {
					print.log( 'error', 'Vagrant v%s is installed. You need at least v%s!', vagrantVer, minRequired );
				} else {
					print.log( 'info', 'Vagrant v%s looks good!', vagrantVer );
				}
			}
		} );

		process.on( 'close', fulfill );
	} );
}

/**
 * Check VirtualBox requirements.
 *
 * @returns {NPromise}
 */
function checkVM() {
	return new NPromise( function( fulfill, reject ) {
		var process = exec( 'VBoxManage --version', function( error, stdout, stderr ) {
			if ( error ) {
				print.log( 'error', 'No installation of VirtualBox is detected!' );
				if ( /^win/.test(process.platform) ) {
					print.info( 'You appear to be on Windows. If Hyper-V is enabled, you\'re good to go.' );
				}
			} else {
				var vboxVer = parseVersion( stdout ),
					minRequired = '4.3.20';

				if ( compareVersion( minRequired, vboxVer ) > 0 ) {
					print.log( 'error', 'VirtualBox v%s is installed. You need at least v%s!', vboxVer, minRequired );
				} else {
					print.log( 'info', 'VirtualBox v%s looks good!', vboxVer );
				}
			}
		} );

		process.on( 'close', fulfill );
	} );
}

/**
 * Ensure we're running the right version of Node.
 *
 * @returns {NPromise}
 */
function checkNode() {
	return new NPromise( function( fulfill, reject ) {
		var process = exec( 'node -v', function( error, stdout, stderr ) {
			if ( error ) {
				print.log( 'error', 'No installation of Node is detected - which is bizarre as this is a Node app!' );
			} else {
				var nodeVer = parseVersion( stdout ),
					minRequired = '0.12.0';

				if ( compareVersion( minRequired, nodeVer ) > 0 ) {
					print.log( 'error', 'Node v%s is installed. You need at least v%s!', nodeVer, minRequired );
				} else {
					print.log( 'info', 'Node v%s looks good!', nodeVer );
				}
			}
		} );

		process.on( 'close', fulfill );
	} );
}

/**
 * Ensure we're running the right version of NPM.
 *
 * @returns {NPromise}
 */
function checkNPM() {
	return new NPromise( function( fulfill, reject ) {
		var pass = false;

		var process = exec( 'npm -v', function( error, stdout, stderr ) {
			if ( error ) {
				print.log( 'error', 'No installation of NPM is detected!' );
			} else {
				var npmVer = parseVersion( stdout ),
					minRequired = '2.5.1';

				if ( compareVersion( minRequired, npmVer ) > 0 ) {
					print.log( 'error', 'NPM v%s is installed. You need at least v%s!', npmVer, minRequired );

				} else {
					print.log( 'info', 'NPM v%s looks good!', npmVer );
					pass = true;
				}
			}
		} );

		process.on( 'close', fulfill );
	} );
}

/**
 * Check system compatibility
 *
 * @api public
 */
commands.requirements = function () {
	print.info( 'Verifying your system meets the necessary requirements.' );

	return NPromise.all( [ checkNode(), checkNPM(), checkVagrant(), checkVM(), checkPHP(), checkComposer() ] )
		.then( function() {
			print.info( 'All right, let\'s go!' );
		} );
};

/**
 * Route the command
 */
app.cmd( /requirements/, commands.requirements );