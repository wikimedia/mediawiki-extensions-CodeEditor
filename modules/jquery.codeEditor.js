/* Ace syntax-highlighting code editor extension for wikiEditor */
/* global ace */
/* eslint-disable no-jquery/no-global-selector */
( function () {
	$.wikiEditor.modules.codeEditor = {
		/**
		 * Core Requirements
		 */
		req: [ 'codeEditor' ],
		/**
		 * Configuration
		 */
		cfg: {
			//
		},
		/**
		 * API accessible functions
		 */
		api: {
			//
		},
		/**
		 * Event handlers
		 */
		evt: {
			//
		},
		/**
		 * Internally used functions
		 */
		fn: {
		}

	};

	$.wikiEditor.extensions.codeEditor = function ( context ) {
		let hasErrorsOnSave = false,
			selectedLine = 0,
			textSelectionFn = null;
		const returnFalse = function () {
				return false;
			},
			api = new mw.Api();

		// Initialize state
		let cookieEnabled = parseInt( mw.cookie.get( 'codeEditor-' + context.instance + '-showInvisibleChars' ), 10 );
		context.showInvisibleChars = ( cookieEnabled === 1 );
		cookieEnabled = parseInt( mw.cookie.get( 'codeEditor-' + context.instance + '-lineWrappingActive' ), 10 );
		context.lineWrappingActive = ( cookieEnabled === 1 );

		/*
		 * Event Handlers
		 *
		 * WikiEditor inspects the 'evt' object for event names and uses them if present as additional
		 * event handlers that fire before the default handling.
		 * To prevent WikiEditor from running its own handling, handlers should return false.
		 *
		 * This is also where we can attach some extra information to the events.
		 */
		context.evt = Object.assign( context.evt, {
			keydown: returnFalse,
			change: returnFalse,
			delayedChange: returnFalse,
			cut: returnFalse,
			paste: returnFalse,
			ready: returnFalse,
			codeEditorSubmit: function () {
				const form = this;
				context.evt.codeEditorSync();
				if ( hasErrorsOnSave ) {
					hasErrorsOnSave = false;
					OO.ui.confirm( mw.msg( 'codeeditor-save-with-errors' ) ).then( ( confirmed ) => {
						if ( confirmed ) {
							// Programmatic submit doesn't retrigger this event listener
							form.submit();
						}
					} );
					return false;
				}
				return true;
			},
			codeEditorSave: function () {
				if ( context.codeEditor.getSession().getAnnotations().some( ( ann ) => ann.type === 'error' ) ) {
					hasErrorsOnSave = true;
				}
			},
			codeEditorSync: function () {
				context.$textarea.val( context.$textarea.textSelection( 'getContents' ) );

			}
		} );

		// Make sure to cast '0' to false
		context.codeEditorActive = !!Number( mw.user.options.get( 'usecodeeditor' ) );

		/**
		 * Internally used functions
		 */
		context.fn = Object.assign( context.fn, {
			isCodeEditorActive: function () {
				return context.codeEditorActive;
			},
			isShowInvisibleChars: function () {
				return context.showInvisibleChars;
			},
			isLineWrappingActive: function () {
				return context.lineWrappingActive;
			},
			changeCookieValue: function ( cookieName, value ) {
				mw.cookie.set(
					'codeEditor-' + context.instance + '-' + cookieName,
					value
				);
			},
			aceGotoLineColumn: function () {
				OO.ui.prompt( mw.msg( 'codeeditor-gotoline-prompt' ), {
					textInput: { placeholder: mw.msg( 'codeeditor-gotoline-placeholder' ) }
				} ).then( ( result ) => {
					if ( !result ) {
						return;
					}

					const matches = result.split( ':' );
					let line = 0;
					let column = 0;

					if ( matches.length > 0 ) {
						line = +matches[ 0 ];
						if ( isNaN( line ) ) {
							return;
						} else {
							// Lines are zero-indexed
							line--;
						}
					}
					if ( matches.length > 1 ) {
						column = +matches[ 1 ];
						if ( isNaN( column ) ) {
							column = 0;
						}
					}
					context.codeEditor.navigateTo( line, column );
					// Scroll up a bit to give some context
					context.codeEditor.scrollToRow( line - 4 );
				} );
			},
			setupCodeEditorToolbar: function () {
				const toggleEditor = function ( ctx ) {
					ctx.codeEditorActive = !ctx.codeEditorActive;

					ctx.fn.setCodeEditorPreference( ctx.codeEditorActive );
					ctx.fn.updateCodeEditorToolbarButton();

					if ( ctx.codeEditorActive ) {
						// set it back up!
						ctx.fn.setupCodeEditor();
					} else {
						ctx.fn.disableCodeEditor();
					}
				};
				const toggleInvisibleChars = function ( ctx ) {
					ctx.showInvisibleChars = !ctx.showInvisibleChars;

					ctx.fn.changeCookieValue( 'showInvisibleChars', ctx.showInvisibleChars ? 1 : 0 );
					ctx.fn.updateInvisibleCharsButton();

					ctx.codeEditor.setShowInvisibles( ctx.showInvisibleChars );
				};
				const toggleSearchReplace = function ( ctx ) {
					const searchBox = ctx.codeEditor.searchBox;
					if ( searchBox && $( searchBox.element ).css( 'display' ) !== 'none' ) {
						searchBox.hide();
					} else {
						ctx.codeEditor.execCommand(
							ctx.codeEditor.getReadOnly() ? 'find' : 'replace'
						);
					}
				};
				const toggleLineWrapping = function ( ctx ) {
					ctx.lineWrappingActive = !ctx.lineWrappingActive;

					ctx.fn.changeCookieValue( 'lineWrappingActive', ctx.lineWrappingActive ? 1 : 0 );
					ctx.fn.updateLineWrappingButton();

					ctx.codeEditor.getSession().setUseWrapMode( ctx.lineWrappingActive );
				};
				const indent = function ( ctx ) {
					ctx.codeEditor.execCommand( 'indent' );
				};
				const outdent = function ( ctx ) {
					ctx.codeEditor.execCommand( 'outdent' );
				};
				const gotoLine = function ( ctx ) {
					ctx.codeEditor.execCommand( 'gotolinecolumn' );
				};

				context.api.addToToolbar( context, {
					section: 'main',
					groups: {
						'codeeditor-main': {
							tools: {
								codeEditor: {
									label: mw.msg( 'codeeditor-toolbar-toggle' ),
									type: 'toggle',
									oouiIcon: 'markup',
									action: {
										type: 'callback',
										execute: toggleEditor
									}
								}
							}
						},
						'codeeditor-format': {
							tools: {
								indent: {
									label: mw.msg( 'codeeditor-indent' ),
									type: 'button',
									oouiIcon: 'indent',
									action: {
										type: 'callback',
										execute: indent
									}
								},
								outdent: {
									label: mw.msg( 'codeeditor-outdent' ),
									type: 'button',
									oouiIcon: 'outdent',
									action: {
										type: 'callback',
										execute: outdent
									}
								}

							}
						},
						'codeeditor-style': {
							tools: {
								invisibleChars: {
									label: mw.msg( 'codeeditor-invisibleChars-toggle' ),
									type: 'toggle',
									oouiIcon: 'pilcrow',
									action: {
										type: 'callback',
										execute: toggleInvisibleChars
									}
								},
								lineWrapping: {
									label: mw.msg( 'codeeditor-lineWrapping-toggle' ),
									type: 'toggle',
									oouiIcon: 'wrapping',
									action: {
										type: 'callback',
										execute: toggleLineWrapping
									}
								},
								gotoLine: {
									label: mw.msg( 'codeeditor-gotoline' ),
									type: 'button',
									oouiIcon: 'gotoLine',
									action: {
										type: 'callback',
										execute: gotoLine
									}
								},
								toggleSearchReplace: {
									label: mw.msg( 'codeeditor-searchReplace-toggle' ),
									type: 'button',
									oouiIcon: 'articleSearch',
									action: {
										type: 'callback',
										execute: toggleSearchReplace
									}
								}
							}
						}
					}
				} );
				context.fn.updateCodeEditorToolbarButton();
				context.fn.updateInvisibleCharsButton();
				context.fn.updateLineWrappingButton();
				$( '.group-codeeditor-style' ).prependTo( '.section-main' );
				$( '.group-codeeditor-format' ).prependTo( '.section-main' );
				$( '.group-codeeditor-main' ).prependTo( '.section-main' );
			},
			updateButtonIcon: function ( targetName, iconFn ) {
				const target = '.tool[rel=' + targetName + ']',
					$button = context.modules.toolbar.$toolbar.find( target );

				$button.data( 'setActive' )( iconFn() );
			},
			updateCodeEditorToolbarButton: function () {
				context.fn.updateButtonIcon( 'codeEditor', context.fn.isCodeEditorActive );
			},
			updateInvisibleCharsButton: function () {
				context.fn.updateButtonIcon( 'invisibleChars', context.fn.isShowInvisibleChars );
			},
			updateLineWrappingButton: function () {
				context.fn.updateButtonIcon( 'lineWrapping', context.fn.isLineWrappingActive );
			},
			setCodeEditorPreference: function ( prefValue ) {
				// Abort any previous request
				api.abort();

				api.saveOption( 'usecodeeditor', prefValue ? 1 : 0 )
					.catch( ( code, result ) => {
						if ( code === 'http' && result.textStatus === 'abort' ) {
							// Request was aborted. Ignore error
							return;
						}
						if ( code === 'notloggedin' ) {
							// Expected for non-registered users
							return;
						}

						let message = 'Failed to set code editor preference: ' + code;
						if ( result.error && result.error.info ) {
							message += '\n' + result.error.info;
						}
						mw.log.warn( message );
					} );
			},
			/**
			 * Sets up the iframe in place of the textarea to allow more advanced operations
			 */
			setupCodeEditor: function () {
				const $box = context.$textarea;
				let lang = mw.config.get( 'wgCodeEditorCurrentLanguage' );
				let basePath = mw.config.get( 'wgExtensionAssetsPath', '' );
				if ( basePath.slice( 0, 2 ) === '//' ) {
					// ACE uses web workers, which have importScripts, which don't like relative links.
					// This is a problem only when the assets are on another server, so this rewrite should suffice
					// Protocol relative
					basePath = window.location.protocol + basePath;
				}
				ace.config.set( 'basePath', basePath + '/CodeEditor/modules/lib/ace' );

				if ( lang ) {
					// Ace doesn't like replacing a textarea directly.
					// We'll stub this out to sit on top of it...
					// line-height is needed to compensate for oddity in WikiEditor extension, which zeroes the line-height on a parent container
					// eslint-disable-next-line no-jquery/no-parse-html-literal
					const container = context.$codeEditorContainer = $( '<div style="position: relative"><div class="editor" style="line-height: 1.5em; top: 0; left: 0; right: 0; bottom: 0; position: absolute;"></div></div>' ).insertAfter( $box );
					const editdiv = container.find( '.editor' );

					$box.css( 'display', 'none' );
					container.height( $box.height() );

					// Non-lazy loaded dependencies: Enable code completion
					ace.require( 'ace/ext/language_tools' );

					// Load the editor now
					context.codeEditor = ace.edit( editdiv[ 0 ] );
					context.codeEditor.getSession().setValue( $box.val() );
					$box.textSelection( 'register', textSelectionFn );

					// Disable some annoying keybindings
					context.codeEditor.commands.bindKeys( {
						'Ctrl-T': null,
						'Ctrl-L': null,
						'Command-L': null
					} );

					context.codeEditor.setReadOnly( $box.prop( 'readonly' ) );
					context.codeEditor.setShowInvisibles( context.showInvisibleChars );

					const htmlClasses = document.documentElement.classList;
					const inDarkMode = htmlClasses.contains( 'skin-theme-clientpref-night' ) || (
						htmlClasses.contains( 'skin-theme-clientpref-os' ) &&
						window.matchMedia && window.matchMedia( '(prefers-color-scheme: dark)' ).matches
					);

					// The options to enable
					context.codeEditor.setOptions( {
						enableBasicAutocompletion: true,
						enableLiveAutocompletion: true,
						enableSnippets: true,
						theme: inDarkMode ? 'ace/theme/monokai' : 'ace/theme/textmate'
					} );

					context.codeEditor.commands.addCommand( {
						name: 'gotolinecolumn',
						bindKey: { mac: 'Command-Shift-L', windows: 'Ctrl-Alt-L' },
						exec: context.fn.aceGotoLineColumn,
						readOnly: true
					} );

					$box.closest( 'form' )
						.on( 'submit', context.evt.codeEditorSubmit )
						.find( '#wpSave' ).on( 'click', context.evt.codeEditorSave );

					const session = context.codeEditor.getSession();

					// Use proper tabs
					session.setUseSoftTabs( false );
					session.setUseWrapMode( context.lineWrappingActive );

					// Configure any workers
					session.on( 'changeMode', ( e, session2 ) => {
						// eslint-disable-next-line no-jquery/variable-pattern
						const mode = session2.getMode().$id;
						if ( mode === 'ace/mode/javascript' ) {
							session2.$worker.send( 'changeOptions', [ {
								maxerr: 1000,
								globals: { mw: true, mediaWiki: true, $: true, jQuery: true, OO: true }
							} ] );
						}
					} );

					mw.hook( 'codeEditor.configure' ).fire( session );

					// Add an Ace change handler to pass changes to Edit Recovery.
					mw.hook( 'editRecovery.loadEnd' ).add( ( data ) => {
						session.on( 'change', data.fieldChangeHandler );
					} );

					ace.config.loadModule( 'ace/ext/modelist', ( modelist ) => {
						if ( !modelist || !modelist.modesByName[ lang ] ) {
							lang = 'text';
						}
						session.setMode( 'ace/mode/' + lang );
					} );

					// Use jQuery UI resizable() so that users can make the box taller

					container.resizable( {
						handles: 's',
						minHeight: $box.height(),
						resize: function () {

							context.codeEditor.resize();
						}
					} );
					$( '.wikiEditor-ui-toolbar' ).addClass( 'codeEditor-ui-toolbar' );

					if ( selectedLine > 0 ) {
						// Line numbers in CodeEditor are zero-based
						context.codeEditor.navigateTo( selectedLine - 1, 0 );
						// Scroll up a bit to give some context
						context.codeEditor.scrollToRow( selectedLine - 4 );
					}

					context.fn.setupStatusBar();

					document.body.classList.remove( 'codeeditor-loading' );

					// Let modules know we're ready to start working with the content
					context.fn.trigger( 'ready' );
				}
			},

			/**
			 * Turn off the code editor view and return to the plain textarea.
			 * May be needed by some folks with funky browsers, or just to compare.
			 */
			disableCodeEditor: function () {
				// Kills it!
				context.$textarea.closest( 'form' )
					.off( 'submit', context.evt.codeEditorSubmit )
					.find( '#wpSave' ).off( 'click', context.evt.codeEditorSave );

				// Save contents
				context.$textarea.textSelection( 'unregister' );
				context.$textarea.val( textSelectionFn.getContents() );

				// @todo fetch cursor, scroll position

				// Drop the fancy editor widget...
				context.fn.removeStatusBar();
				context.$codeEditorContainer.remove();
				context.$codeEditorContainer = undefined;
				context.codeEditor = undefined;

				// Restore textarea
				context.$textarea.show();
				// Restore toolbar
				$( '.wikiEditor-ui-toolbar' ).removeClass( 'codeEditor-ui-toolbar' );

				// @todo restore cursor, scroll position
			},

			/**
			 * Start monitoring the fragment of the current window for hash change
			 * events. If the hash is already set, handle it as a new event.
			 */
			codeEditorMonitorFragment: function () {
				function onHashChange() {
					const regexp = /#mw-ce-l(\d+)/;
					const result = regexp.exec( window.location.hash );

					if ( result === null ) {
						return;
					}

					selectedLine = parseInt( result[ 1 ], 10 );
					if ( context.codeEditor && selectedLine > 0 ) {
						// Line numbers in CodeEditor are zero-based
						context.codeEditor.navigateTo( selectedLine - 1, 0 );
						// Scroll up a bit to give some context
						context.codeEditor.scrollToRow( selectedLine - 4 );
					}
				}

				onHashChange();
				$( window ).on( 'hashchange', onHashChange );
			},
			/**
			 * This creates a Statusbar, that allows you to see a count of the
			 * errors, warnings and the warning of the current line, as well as
			 * the position of the cursor.
			 */
			setupStatusBar: function () {
				let shouldUpdateAnnotations,
					shouldUpdateSelection,
					shouldUpdateLineInfo,
					nextAnnotation;
				const editor = context.codeEditor,
					lang = ace.require( 'ace/lib/lang' ),
					$errors = $( '<span>' ).addClass( 'codeEditor-status-worker-cell ace_gutter-cell ace_error' ).text( '0' ),
					$warnings = $( '<span>' ).addClass( 'codeEditor-status-worker-cell ace_gutter-cell ace_warning' ).text( '0' ),
					$infos = $( '<span>' ).addClass( 'codeEditor-status-worker-cell ace_gutter-cell ace_info' ).text( '0' ),
					$message = $( '<div>' ).addClass( 'codeEditor-status-message' ),
					$lineAndMode = $( '<div>' ).addClass( 'codeEditor-status-line' ),
					$workerStatus = $( '<div>' )
						.addClass( 'codeEditor-status-worker' )
						.attr( 'title', mw.msg( 'codeeditor-next-annotation' ) )
						.append( $errors )
						.append( $warnings )
						.append( $infos );

				context.$statusBar = $( '<div>' )
					.addClass( 'codeEditor-status' )
					.append( $workerStatus )
					.append( $message )
					.append( $lineAndMode );

				/* Help function to concatenate strings with different separators */
				function addToStatus( status, str, separator ) {
					if ( str ) {
						status.push( str, separator || '|' );
					}
				}

				/**
				 * Update all the information in the status bar
				 */
				function updateStatusBar() {
					let errors = 0,
						warnings = 0,
						infos = 0,
						distance,
						shortestDistance = Infinity,
						closestAnnotation,
						closestType;
					const currentLine = editor.selection.lead.row,
						annotations = editor.getSession().getAnnotations();

					// Reset the next annotation
					nextAnnotation = null;

					for ( let i = 0; i < annotations.length; i++ ) {
						const annotation = annotations[ i ];
						distance = Math.abs( currentLine - annotation.row );

						if ( distance < shortestDistance ) {
							shortestDistance = distance;
							closestAnnotation = annotation;
						}
						if ( nextAnnotation === null && annotation.row > currentLine ) {
							nextAnnotation = annotation;
						}

						switch ( annotations[ i ].type ) {
							case 'error':
								errors++;
								break;
							case 'warning':
								warnings++;
								break;
							case 'info':
								infos++;
								break;
						}
					}
					// Wrap around to the beginning for nextAnnotation
					if ( nextAnnotation === null && annotations.length > 0 ) {
						nextAnnotation = annotations[ 0 ];
					}
					// Update the annotation counts
					if ( shouldUpdateAnnotations ) {
						$errors.text( errors );
						$warnings.text( warnings );
						$infos.text( infos );
					}

					// Show the message of the current line, if we have not already done so
					if ( closestAnnotation &&
							currentLine === closestAnnotation.row &&
							closestAnnotation !== $message.data( 'annotation' ) ) {
						$message.data( 'annotation', closestAnnotation );
						closestType =
							closestAnnotation.type.charAt( 0 ).toUpperCase() +
							closestAnnotation.type.slice( 1 );

						$message.text( closestType + ': ' + closestAnnotation.text );
					} else if ( $message.data( 'annotation' ) !== null &&
							( !closestAnnotation || currentLine !== closestAnnotation.row ) ) {
						// If we are on a different line without an annotation, then blank the message
						$message.data( 'annotation', null );
						$message.text( '' );
					}

					// The cursor position has changed
					if ( shouldUpdateSelection || shouldUpdateLineInfo ) {
						// Adapted from Ajax.org's ace/ext/statusbar module
						const status = [];

						if ( editor.$vimModeHandler ) {
							addToStatus( status, editor.$vimModeHandler.getStatusText() );
						} else if ( editor.commands.recording ) {
							addToStatus( status, 'REC' );
						}

						const c = editor.selection.lead;
						addToStatus( status, ( c.row + 1 ) + ':' + c.column, '' );
						if ( !editor.selection.isEmpty() ) {
							const r = editor.getSelectionRange();
							addToStatus( status, '(' + ( r.end.row - r.start.row ) + ':' + ( r.end.column - r.start.column ) + ')' );
						}
						status.pop();
						$lineAndMode.text( status.join( '' ) );
					}

					shouldUpdateLineInfo = shouldUpdateSelection = shouldUpdateAnnotations = false;
				}

				// Function to delay/debounce updates for the StatusBar
				const delayedUpdate = lang.delayedCall( () => {
					updateStatusBar( editor );
				} );

				/**
				 * Click handler that allows you to skip to the next annotation
				 */
				$workerStatus.on( 'click', ( e ) => {
					if ( nextAnnotation ) {
						context.codeEditor.navigateTo( nextAnnotation.row, nextAnnotation.column );
						// Scroll up a bit to give some context
						context.codeEditor.scrollToRow( nextAnnotation.row - 3 );
						e.preventDefault();
					}
				} );

				editor.getSession().on( 'changeAnnotation', () => {
					shouldUpdateAnnotations = true;
					delayedUpdate.schedule( 100 );
				} );
				editor.on( 'changeStatus', () => {
					shouldUpdateLineInfo = true;
					delayedUpdate.schedule( 100 );
				} );
				editor.on( 'changeSelection', () => {
					shouldUpdateSelection = true;
					delayedUpdate.schedule( 100 );
				} );

				// Force update
				shouldUpdateLineInfo = shouldUpdateSelection = shouldUpdateAnnotations = true;
				updateStatusBar( editor );

				context.$statusBar.insertAfter( context.$ui.find( '.wikiEditor-ui-bottom' ) );
			},
			removeStatusBar: function () {
				context.codeEditor.getSession().removeListener( 'changeAnnotation' );
				context.codeEditor.removeListener( 'changeSelection' );
				context.codeEditor.removeListener( 'changeStatus' );
				context.nextAnnotation = null;
				context.$statusBar = null;

				$( '.codeEditor-status' ).remove();
			}

		} );

		/**
		 * Override the base functions in a way that lets
		 * us fall back to the originals when we turn off.
		 *
		 * @param {Object} base
		 * @param {Object} extended
		 */
		const saveAndExtend = function ( base, extended ) {
			// eslint-disable-next-line no-jquery/no-map-util
			$.map( extended, ( func, name ) => {
				if ( name in base ) {
					const orig = base[ name ];
					base[ name ] = function () {
						if ( context.codeEditorActive ) {
							return func.apply( this, arguments );
						}
						if ( orig ) {
							return orig.apply( this, arguments );
						}
						throw new Error( 'CodeEditor: no original function to call for ' + name );
					};
				} else {
					base[ name ] = func;
				}
			} );
		};

		saveAndExtend( context.fn, {
			saveSelection: function () {
				mw.log( 'codeEditor stub function saveSelection called' );
			},
			restoreSelection: function () {
				mw.log( 'codeEditor stub function restoreSelection called' );
			},

			/**
			 * Scroll an element to the top of the iframe
			 */
			scrollToTop: function () {
				mw.log( 'codeEditor stub function scrollToTop called' );
			}
		} );

		/**
		 * Compatibility with the $.textSelection jQuery plug-in. When the iframe is in use, these functions provide
		 * equivalant functionality to the otherwise textarea-based functionality.
		 */
		textSelectionFn = {

			/* Needed for search/replace */
			getContents: function () {
				return context.codeEditor.getSession().getValue();
			},

			setContents: function ( newContents ) {
				context.codeEditor.getSession().setValue( newContents );
				return context.$textarea;
			},

			/**
			 * Gets the currently selected text in the content
			 * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
			 *
			 * @return {string}
			 */
			getSelection: function () {
				return context.codeEditor.getCopyText();
			},

			/**
			 * Replace the current selection with the given text.
			 * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
			 *
			 * @param {string} text
			 * @return {jQuery}
			 */
			replaceSelection: function ( text ) {
				context.codeEditor.insert( text );
				return context.$textarea;
			},

			/**
			 * Inserts text at the begining and end of a text selection, optionally inserting text at the caret when
			 * selection is empty.
			 * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
			 *
			 * @param {Object} options
			 * @return {jQuery}
			 */
			encapsulateSelection: function ( options ) {
				// Does not yet handle 'ownline', 'splitlines' option
				const sel = context.codeEditor.getSelection();
				const range = sel.getRange();
				let selText = textSelectionFn.getSelection();
				let isSample = false;

				if ( !selText ) {
					selText = options.peri;
					isSample = true;
				} else if ( options.replace ) {
					selText = options.peri;
				}

				let text = options.pre;
				text += selText;
				text += options.post;
				context.codeEditor.insert( text );
				if ( isSample && options.selectPeri && !options.splitlines ) {
					// May esplode if anything has newlines, be warned. :)
					range.setStart( range.start.row, range.start.column + options.pre.length );
					range.setEnd( range.start.row, range.start.column + selText.length );
					sel.setSelectionRange( range );
				}
				return context.$textarea;
			},

			/**
			 * Gets the position (in resolution of bytes not nessecarily characters) in a textarea
			 * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
			 *
			 * @param {Object} options
			 * @param {Object} [options.startAndEnd=false] Return range of the selection rather than just start
			 * @return {number|number[]} If options.startAndEnd is true, returns an array holding the start and
			 * end of the selection, else returns only the start of the selection as a single number.
			 */
			getCaretPosition: function ( options ) {
				const selection = context.codeEditor.getSelection(),
					range = selection.getRange(),
					doc = context.codeEditor.getSession().getDocument(),
					startOffset = doc.positionToIndex( range.start );

				if ( options.startAndEnd ) {
					const endOffset = doc.positionToIndex( range.end );
					return [ startOffset, endOffset ];
				}

				return startOffset;
			},

			/**
			 * Sets the selection of the content
			 * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
			 *
			 * @param {Object} options
			 * @return {jQuery}
			 */
			setSelection: function ( options ) {
				// Ace stores positions for ranges as row/column pairs.
				// To convert from character offsets, we'll need to iterate through the document
				const doc = context.codeEditor.getSession().getDocument();
				const lines = doc.getAllLines();

				const offsetToPos = function ( offset ) {
					let row, col, pos;

					row = 0;
					col = 0;
					pos = 0;

					while ( row < lines.length && pos + lines[ row ].length < offset ) {
						pos += lines[ row ].length;
						pos++; // for the newline
						row++;
					}
					col = offset - pos;
					return { row: row, column: col };
				};
				const start = offsetToPos( options.start );
				const end = offsetToPos( options.end );

				const sel = context.codeEditor.getSelection();
				const range = sel.getRange();
				range.setStart( start.row, start.column );
				range.setEnd( end.row, end.column );
				sel.setSelectionRange( range );
				return context.$textarea;
			},

			/**
			 * Scroll a textarea to the current cursor position. You can set the cursor position with setSelection()
			 * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
			 *
			 * @return {jQuery}
			 */
			scrollToCaretPosition: function () {
				mw.log( 'codeEditor stub function scrollToCaretPosition called' );
				return context.$textarea;
			}
		};

		/* Setup the editor */
		context.fn.setupCodeEditorToolbar();
		if ( context.codeEditorActive ) {
			context.fn.setupCodeEditor();
		}

	};
}() );
