/*!
 * Grunt file
 *
 * @package CodeEditor
 */

'use strict';

module.exports = function ( grunt ) {
	const conf = grunt.file.readJSON( 'extension.json' );
	grunt.loadNpmTasks( 'grunt-banana-checker' );
	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-copy' );
	grunt.loadNpmTasks( 'grunt-eslint' );
	grunt.loadNpmTasks( 'grunt-exec' );
	grunt.loadNpmTasks( 'grunt-stylelint' );

	grunt.initConfig( {
		eslint: {
			options: {
				cache: true,
				fix: grunt.option( 'fix' )
			},
			all: [ '.' ]
		},
		stylelint: {
			all: [
				'**/*.{css,less}',
				'!node_modules/**',
				'!modules/lib/**',
				'!vendor/**'
			]
		},
		banana: {
			options: {
				requireLowerCase: false
			},
			all: conf.MessagesDirs.CodeEditor
		},
		exec: {
			'npm-update-ace': {
				cmd: 'npm update ace-builds',
				callback: function ( error, stdout, stderr ) {
					grunt.log.write( stdout );
					if ( stderr ) {
						grunt.log.write( 'Error: ' + stderr );
					}

					if ( error !== null ) {
						grunt.log.error( 'update error: ' + error );
					}
				}
			}
		},
		clean: {
			ace: [ 'modules/lib/ace/*' ]
		},
		copy: {
			ace: {
				expand: true,
				cwd: 'node_modules/ace-builds/src-noconflict/',
				src: [ '**' ],
				dest: 'modules/lib/ace/'
			},
			'ace-misc-files': {
				expand: true,
				cwd: 'node_modules/ace-builds/',
				src: [ 'LICENSE', 'CHANGELOG.md', 'README.md' ],
				dest: 'modules/lib/ace/'
			}
		}
	} );

	grunt.registerTask( 'update-ace', [ 'exec:npm-update-ace', 'clean:ace', 'copy:ace', 'copy:ace-misc-files' ] );
	grunt.registerTask( 'test', [ 'eslint', 'stylelint', 'banana' ] );
	grunt.registerTask( 'default', 'test' );
};
