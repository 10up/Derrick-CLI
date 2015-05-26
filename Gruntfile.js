module.exports = function( grunt ) {
	'use strict';

	// Load all tasks
	require( 'matchdep' ).filterDev( 'grunt-*' ).forEach( grunt.loadNpmTasks );

	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),

		jshint: {
			project: {
				files  : {
					src: [
						'lib/**/*.js'
					]
				},
				options: {
					jshintrc: '.jshintrc'
				}
			},
			grunt  : {
				files  : {
					all: [
						'Gruntfile.js'
					]
				},
				options: {
					jshintrc: '.gruntjshintrc'
				}
			}
		},

		mochaTest: {
			test: {
				options: {
					reporter: 'spec',
					captureFile: 'results.txt',
					quiet: false,
					clearRequireCache: true
				},
				src: [ 'test/**/*.js' ]
			}
		}
	} );

	grunt.registerTask( 'test', [ 'mochaTest' ] );
	grunt.registerTask( 'default', [ 'jshint', 'mochaTest' ] );

	grunt.util.linefeed = '\n';
};