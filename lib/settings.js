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
 * Module dependencies.
 */
var fs = require( 'fs' ),
	NPromise = require( 'promise' ),
	_ = require( 'lodash' ),
	path = require( 'path' );

/**
 * Default settings.
 *
 * @type {Object}
 */
var defaults = {

	},
	settings,
	loaded = false;

/**
 * Make sure the .derrick.d file exists. If not, create it.
 *
 * @param {String} filePath
 */
function verify_file( filePath ) {
	if ( ! fs.existsSync( filePath ) ) {
		fs.writeFileSync( filePath, JSON.stringify( {} ), { flag: 'wx' } );
	}
}

/**
 * Load up our settings from the .derrick.d file in the home directory.
 *
 * If it doesn't exist, create it (but leave it empty).
 */
function load_settings() {
	var home = process.env.HOME || process.env.USERPROFILE,
		config = path.join( home, '.derrick.d' );

	// Make sure the configuration file exists.
	verify_file( config );

	// Read the file
	var data = fs.readFileSync( config );

	// Parse its contents and save them in our settings object.
	settings = JSON.parse( data );
	loaded = true;
}

/**
 * Serialize and store our output.
 */
function save_settings() {
	// Make sure our settings exist, first.
	loaded || load_settings();

	var home = process.env.HOME || process.env.USERPROFILE,
		config = path.join( home, '.derrick.d' );

	// Make sure the configuration file exists.
	verify_file( config );

	// Save the settings out
	fs.writeFileSync( config, JSON.stringify( settings ), {flag: 'w' } );
}

/**
 * Get a named setting.
 *
 * @param {String} name
 *
 * @returns {*}
 */
function get( name ) {
	loaded || load_settings();

	if ( undefined === settings[name] ) {
		if ( undefined === defaults[name] ) {
			return undefined;
		}

		return defaults[name];
	}

	return settings[name];
}

/**
 * Add a setting to the collection.
 *
 * @param {String} name
 * @param {*}      value
 */
function set( name, value ) {
	loaded || load_settings();

	settings[name] = value;
	save_settings();
}

/**
 * Generate a pseudo-random, unique ID.
 *
 * @returns {String}
 */
function unique_id() {
	var crypto = require( 'crypto' );

	return crypto.randomBytes( 4 ).toString( 'hex' ).slice( 0, 7 );
}

/**
 * Reset all settings
 */
function reset() {
	settings = {};
	loaded = true;
	save_settings();
}

/**
 * Update the global Derrick status, adding the new project
 *
 * @param {Array} args
 *
 * @returns {NPromise}
 */
function update_status( args ) {
	var vm = args[0],
		data = args[1];

	return new NPromise( function( fulfill, reject ) {
		var vms = get( 'vms' ) || {};

		// Find this VM in the array - if it doesn't exist, create one
		var this_vm = false, vm_id = false;
		_.forEach( vms, function( value, id ) {
			if ( value.path == vm.root ) {
				this_vm = vms[ id ];
				vm_id = id;
				return;
			}
		} );

		if ( ! this_vm ) {
			vm_id = unique_id();
			this_vm = {
				'path': vm.root,
				'cli': 0,
				'projects': {}
			};
		}

		// Update the CLI version
		this_vm.cli = require( '../package.json' ).version;

		// Add the project to the collection
		this_vm.projects[ data.name ] = {
			'path': data.project,
			'hostname': data.hostname
		};

		// Update the VM collection
		vms[ vm_id ] = this_vm;

		// Save our settings
		set( 'vms', vms );

		// Exit
		fulfill( args );
	} );
}

/**
 * Export the settings object.
 *
 * @type {Object}
 */
module.exports = {
	get: get,
	set: set,
	unique_id: unique_id,
	reset: reset,
	update_status: update_status
};