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
var print = require( 'winston' ).cli(),
	app = require( '../app' ),
	commands = require( '../commands'),
	_ = require( 'lodash' ),
	prompt = require( 'prompt' ),
	NPromise = require( 'promise' );

/**
 * Init command wrapper. This command starts with a wizard for generating a manifest.json file. Then....
 */
module.exports = function() {
	prompt.start();

	/**
	 * Filled out manifest.json object
	 *
	 * @type {{name: string, hostname: Array, uploads: string, database: string, maintainers: {}, dev_resources: {}, vendor_resources: {}}}
	 */
	var manifest = {
		name: '',
		hostname: [],
		uploads: '',
		wordpress: 4.1,
		php: 5.6,
		webserver: 'nginx',
		database: '',
		maintainers: [],
		dev_resources: [],
		vendor_resources: []
	};

	var schema = {
		properties: {
			name: {
				pattern: /^[a-zA-Z0-9\-]+$/,
				description: 'Name (letters, numbers, and dashes)',
				required: true
			},
			hosts: {
				pattern: /^[a-zA-Z\s\-0-9\.,]+$/,
				description: 'Hosts you want to point to the project i.e. test.dev, www.test.dev (comma separated)'
			},
			uploads: {
				description: 'URL to uploads archive file'
			},
			database: {
				description: 'URL to database SQL or archive file'
			},
			webserver: {
				description: 'Web server to use (nginx or apache)',
				pattern: /^(apache|nginx)$/i,
				default: 'nginx'
			},
			php: {
				description: 'PHP version to use',
				default: 5.6
			},
			wordpress: {
				description: 'WordPress version to use',
				default: 4.1
			}
		}
	};

	print.info( 'This utility will assist you in creating a new project in Derrick with a corresponding manifest.json file.' );

	/**
	 * Prompt for basic non-repeating information
	 *
	 * @returns {NPromise}
	 */
	var promptBasics = function() {
		return new NPromise( function( fulfill ) {
			prompt.get( schema, function( error, result ) {
				_.extend( manifest, result );

				if ( result.hosts ) {
					manifest.hostname = result.hosts.replace( ' ', '' ).split( ',' );
				}

				delete manifest.hosts;

				fulfill();
			} );
		} );
	};

	/**
	 * Prompt for vendor resources
	 *
	 * @returns {NPromise}
	 */
	var promptVendor = function() {
		return new NPromise( function( fulfill ) {

			var maybeVendorSchema = {
				properties: {
					vendor: {
						description: 'Do you want to add a vendor resource? [y/n]',
						pattern: /^(yes|no|n|y)$/i,
						required: true,
						default: 'n'
					}
				}
			};

			var vendorSchema = {
				properties: {
					type: {
						description: 'Type of resource. Either plugin, mu-plugin, or theme.',
						pattern: /^(plugin|mu-plugin|theme)$/i,
						required: true
					},
					name: {
						description: 'Name of resource. This is assumed to be a resource available on WordPress.org, otherwise a URL must be provided.',
						required: true
					},
					url: {
						description: "Remote location of an archive hosting the resource's code."
					},
					reference: {
						description: 'Commit or version reference for checkout. If omitted, the system will check out the current HEAD of the master branch.'
					}
				}
			};

			/**
			 * Prompt to determine whether to add a vendor resource or not
			 */
			function newVendorPrompt() {
				prompt.get( vendorSchema, function( error, result ) {
					manifest.vendor_resources.push( result );

					maybeVendorPrompt();
				});
			}

			/**
			 * Conditionally prompt for vendor information
			 */
			function maybeVendorPrompt() {
				prompt.get( maybeVendorSchema, function( error, result ) {
					maybeVendorSchema.properties.vendor.description = 'Do you want to add another vendor resource? [y/n]';

					if ( result.vendor.match( /^(y|yes)$/i ) ) {
						newVendorPrompt();
					} else {
						fulfill();
					}
				});
			}

			maybeVendorPrompt();
		} );
	};

	/**
	 * Prompt for dev resources
	 *
	 * @returns {NPromise}
	 */
	var promptDev = function() {
		return new NPromise( function( fulfill ) {

			var maybeDevSchema = {
				properties: {
					dev: {
						description: 'Do you want to add a dev resource? [y/n]',
						pattern: /^(yes|no|n|y)$/i,
						required: true,
						default: 'n'
					}
				}
			};

			var devSchema = {
				properties: {
					url: {
						description: "Remote location of the version control repository hosting the resource's code",
						required: true
					},
					type: {
						description: 'Type of resource. Either plugin, mu-plugin, or theme.',
						pattern: /^(plugin|mu-plugin|theme)$/i,
						required: true
					},
					name: {
						description: 'The name of the project. If not defined, the basename value of url will be used after removing any vcs-related endings.'
					},
					vcs: {
						description: 'Type of version control system to use. Either git or svn.',
						default: 'git',
						pattern: /^(git|svn)$/i
					},
					location: {
						description: 'Defaults to the name property. Use this to change the default location of a resource (e.g. VIP themes should be installed in the /vip/ subdirectory inside /themes/). Use {name} as a placeholder for the default name (e.g. vip/{name}).'
					}
				}
			};

			/**
			 * Prompt to determine whether to add a dev resource or not
			 */
			function newDevPrompt() {
				prompt.get( devSchema, function( error, result ) {
					manifest.dev_resources.push( result );

					maybeDevPrompt();
				});
			}

			/**
			 * Conditionally prompt for dev information
			 */
			function maybeDevPrompt() {
				prompt.get( maybeDevSchema, function( error, result ) {
					maybeDevSchema.properties.dev.description = 'Do you want to add another dev resource? [y/n]';

					if ( result.dev.match( /^(y|yes)$/i ) ) {
						newDevPrompt();
					} else {
						fulfill();
					}
				});
			}

			maybeDevPrompt();
		} );
	};

	/**
	 * Prompt for maintainers
	 *
	 * @returns {NPromise}
	 */
	var promptMaintainer = function() {
		return new NPromise( function( fulfill ) {

			var maybeMaintainerSchema = {
				properties: {
					maintainer: {
						description: 'Do you want to add a maintainer? [y/n]',
						pattern: /^(yes|no|n|y)$/,
						required: true,
						default: 'n'
					}
				}
			};

			var maintainerSchema = {
				properties: {
					name: {
						description: 'Name of maintainer',
						required: true
					},
					email: {
						description: 'Email of maintainer',
						required: true
					},
					company: {
						description: 'Company of maintainer',
						required: false
					}
				}
			};

			/**
			 * Prompt to determine whether to add a maintainer or not
			 */
			function newMaintainerPrompt() {
				prompt.get( maintainerSchema, function( error, result ) {
					manifest.maintainers.push( result );

					maybeMaintainerPrompt();
				});
			}

			/**
			 * Conditionally prompt for maintainer information
			 */
			function maybeMaintainerPrompt() {
				prompt.get( maybeMaintainerSchema, function( error, result ) {
					maybeMaintainerSchema.properties.maintainer.description = 'Do you want to add another maintainer? [y/n]';

					if ( result.maintainer.match( /^(y|yes)$/i ) ) {
						newMaintainerPrompt();
					} else {
						fulfill();
					}
				});
			}

			maybeMaintainerPrompt();
		} );
	};

	return promptBasics()
		.then( promptDev )
		.then( promptVendor )
		.then( promptMaintainer )
		.then( function() {
			print.info( 'Manifest.json created' );

			return commands.import_json( manifest );
		} );
};

/**
 * Route the command
 */
app.cmd( /create/, module.exports );
