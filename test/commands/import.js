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

	} );

	describe( 'importDatabase', function() {

	} );

	describe( 'createAutoloader', function() {

	} );

	describe( 'createConfigFile', function() {

	} );

	describe( 'createNginxConfigs', function() {

	} );

	describe( 'mountFilesystem', function() {

	} );

	describe( 'runImport', function() {

	} );

	describe( 'createLockFile', function() {

	} );

	describe( 'storeHostsMap', function() {

	} );

	describe( 'createAliases', function() {

	} );

	describe( 'writeCompiledData', function() {

	} );

	describe( 'create_chain', function() {

	} );

	describe( 'update_hosts', function() {

	} );

	describe( 'resync_hosts', function() {

	} );

	describe( 'import_file', function() {

	} );

	describe( 'import_json', function() {

	} );

	it( 'Should register an import command' );
} );