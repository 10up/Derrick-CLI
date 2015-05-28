/**
 * Verify the behavior of the various import commands
 */

/**
 * Test dependencies
 */
var proxyquire = require( 'proxyquire' ).noCallThru(),
	assert = require( 'assert' );

describe( 'import', function() {
	describe( 'writeJson', function() {
		it( 'Should write JSON to disk' );
	} );

	describe( 'ensureVagrantIsRunning', function() {
		it( 'Should query Vagrant status' );

		it( 'Should attempt to boot Vagrant' );
	} );

	describe( 'parseJSON', function() {
		it( 'Should reject invalid objects' );

		it( 'Should pass along a parsed object' );
	} );

	describe( 'parseConfig', function() {
		it( 'Should validate required name' );

		it( 'Should validate required hostname' );

		it( 'Should validate required dev_resources' );

		it( 'Should validate required vendor_resources' );

		it( 'Should validate required database' );

		it( 'Should validate required uploads' );

		it( 'Gets the latest version of WordPress' );

		it( 'Passes along a valid config object' );
	} );

	describe( 'createProjectDirectories', function() {
		it( 'Should create config directories' );

		it( 'Should create WordPress directories' );
	} );

	describe( 'moveManifestFile', function() {
		it( 'Should copy manifest to project root' );
	} );

	describe( 'createManifestFile', function() {
		it( 'Should create a new manifest file in the project root' );
	} );

	describe( 'installDevResources', function() {
		it( 'Should install VCS resources' );
	} );

	describe( 'installVendorResources', function() {
		it( 'Should create a Composer.json file' );

		it( 'Should use Composer to install vendor resources' );
	} );

	describe( 'createDatabase', function() {
		it( 'Should invoke the createDB command' );
	} );

	describe( 'importUploads', function() {
		it( 'Should download assets' );

		it( 'Should unzip a compressed file' );

		it( 'Should untar a tarfile' );
	} );

	describe( 'importDatabase', function() {
		it( 'Should invoke the importDB command' );
	} );

	describe( 'createAutoloader', function() {
		it( 'Should populate a template' );
	} );

	describe( 'createConfigFile', function() {
		it( 'Should populate a template' );
	} );

	describe( 'createNginxConfigs', function() {
		it( 'Should populate templates' );
	} );

	describe( 'mountFilesystem', function() {
		it( 'Should invoke the server mount-fs command' );
	} );

	describe( 'runImport', function() {
		it( 'Should batch the install and template commands' );

		it( 'Should mount filesystems' );
	} );

	describe( 'createLockFile', function() {
		it( 'Should create the manifest lockfile' );
	} );

	describe( 'storeHostsMap', function() {
		it( 'Should create a new hostmap file' );

		it( 'Should update an existing hostmap file' );
	} );

	describe( 'createAliases', function() {
		it( 'Should create CLI aliases' );
	} );

	describe( 'writeCompiledData', function() {
		it( 'Should create the lockfile' );

		it( 'Should store the hosts file' );

		it( 'Should create command aliaes' );
	} );

	describe( 'create_chain', function() {
		it( 'Should create the Docker chain on the server' );
	} );

	describe( 'update_hosts', function() {
		it( 'Should create a new aliases file' );

		it( 'Should update an existing aliases file' );
	} );

	describe( 'resync_hosts', function() {
		it( 'Should invoke vagrant ghost' );
	} );

	describe( 'import_file', function() {
		it( 'Should import a static manifest.json file' );
	} );

	describe( 'import_json', function() {
		it( 'Should import a JSON object as if it were a manifest file' );
	} );

	it( 'Should register an import command' );
} );