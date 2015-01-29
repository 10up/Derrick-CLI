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
var util = require( 'util' ),
	path = require( 'path' ),
	NPromise = require( 'promise' ),
	mkdirp = require( 'mkdirp' );

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
 * Kill the process and output an exit code.
 *
 * @param {Number} code
 * @param {String} msg
 * @private
 */
function _exit( code, msg ) {
	"use strict";
	if ( code && 'number' !== typeof code ) {
		msg = code;
		code = 0;
	}

	code = parseInt( code, 10 );
	if ( isNaN( code ) ) {
		code = 0;
	}

	msg += '';
	if ( msg ) {
		if ( code ) {
			util.error( msg );
		} else {
			util.debug( msg );
		}
	}

	process.exit( code );
}

/**
 * Explicitly exit with an error message.
 *
 * @param {String} msg
 * @private
 */
function _exit_error( msg ) {
	"use strict";
	_exit( 1, msg );
}

/**
 * Parse a configuration file.
 *
 * @param {string} thing
 */
function parseConfig( thing ) {
	'use strict';
	var data, vm, x;

	try {
		data = JSON.parse( thing );
	} catch ( e ) {
		_exit_error( 'Could not parse JSON!\n\n' +
		'Error message:\n' + e + '\n' );
	}

	var requiredFields = [
			'name',
			'dev_resources',
			'vendor_resources',
			'database',
			'uploads'
		];

	for ( x = 0; x < requiredFields.length; x += 1 ) {
		if ( undefined === data[requiredFields[x]] ) {
			_exit_error( util.format( '%s is a required field!\n', requiredFields[x] ) );
		}
	}

	try {
		vm = new VM( process.cwd() );
	} catch ( e ) {
		_exit_error( 'Error: ' + e + '\n' );
	}

	ensureProjectDirectory( vm, data ).then( runProjectImport( data, vm ), _exit_error );
}

/**
 * Make sure a project directory exists.
 *
 * @param vm
 * @param data
 * @returns {NPromise}
 */
function ensureProjectDirectory( vm, data ) {
	"use strict";
	var mkdir = NPromise.denodeify( mkdirp );

	return new NPromise( function ( resolve, reject ) {
		var projects = path.join( vm.root, 'projects' ),
			project = path.join( projects, data.name ),
			cache = path.join( vm.root, '_cache' ),
			done = function () {
				resolve( true );
			};
		data.project = project;
		NPromise.all( [mkdir( project ), mkdir( cache )] ).then( done, done );
	} );
}

/**
 * Make sure all dev resources are installed to the Projects directory.
 *
 * @param {Array} rawResources
 * @param project
 * @returns {*}
 */
function installDevResources( rawResources, project ) {
	"use strict";
	util.print( 'Fetching dev resources...\n' );
	var resourcePromises = [], x;

	try {
		for ( x = 0; x < rawResources.length; x += 1 ) {
			var resource = resources.VcsResource.newFromVcs( rawResources[x] );
			mkdirp.sync( path.dirname( path.join( project, resource.path ) ) );
			util.print( util.format( 'Fetching %s...\n', resource.name ) );
			resourcePromises.push( resource.install( path.join( project, resource.path ) ) );
		}
	} catch ( e ) {
		// do nothing
	}

	var all = NPromise.all( resourcePromises );
	all.then( null, function ( res ) {
		_exit_error( util.format( 'Not all dev resources could be installed!\n%s\n', res ) );
	} );

	return all;
}

/**
 * Make sure all non-dev resources are installed correctly.
 *
 * @param {Array} vendorResources
 *
 * @returns {*}
 */
function installVendorResources( vendorResources ) {
	"use strict";
	var resourcePromises = [],
		x,
		all,
		resource;

	try {
		for ( x = 0; x < vendorResources.length; x += 1 ) {
			resource = resources.Resource.newFromData( vendorResources[x] );
		}
	} catch ( e ) {
		// do nothing
	}

	all = NPromise.all( resourcePromises );
	all.then( null, function ( res ) {
		_exit_error( util.format( 'Not all dev resources could be installed!\n%s\n', res ) );
	} );

	return all;
}




/**
 * Prints the current version.
 *
 * @api public
 */
commands.import_manifest = function() {

};

/**
 * Rout the command
 */
app.cmd( /import/, commands.import_manifest );