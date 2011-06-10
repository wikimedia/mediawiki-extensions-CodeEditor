/* Ace syntax-highlighting code editor extension for wikiEditor */

( function( $ ) {

$.wikiEditor.modules.codeEditor = {

/**
 * Core Requirements
 */
'req': [ 'codeEditor' ],
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

$.wikiEditor.extensions.codeEditor = function( context ) {

/*
 * Event Handlers
 *
 * These act as filters returning false if the event should be ignored or returning true if it should be passed
 * on to all modules. This is also where we can attach some extra information to the events.
 */
context.evt = $.extend( context.evt, {
	/**
	 * Filters change events, which occur when the user interacts with the contents of the iframe. The goal of this
	 * function is to both classify the scope of changes as 'division' or 'character' and to prevent further
	 * processing of events which did not actually change the content of the iframe.
	 */
	'keydown': function( event ) {
	},
	'change': function( event ) {
	},
	'delayedChange': function( event ) {
	},
	'cut': function( event ) {
	},
	'paste': function( event ) {
	},
	'ready': function( event ) {
	}
} );

/**
 * Internally used functions
 */
context.fn = $.extend( context.fn, {
	'saveCursorAndScrollTop': function() {
		// Stub out textarea behavior
		return;
	},
	'restoreCursorAndScrollTop': function() {
		// Stub out textarea behavior
		return;
	},
	'saveSelection': function() {
	},
	'restoreSelection': function() {
	},
	/**
	 * Sets up the iframe in place of the textarea to allow more advanced operations
	 */
	'setupCodeEditor': function() {
		var box = context.$textarea;

		var matches = /\.(js|css)$/.exec(wgTitle);
		if (matches && (wgNamespaceNumber == 2 /* User: */ || wgNamespaceNumber == 8 /* MediaWiki: */)) {
			var ext = matches[1];
			var map = {js: 'javascript', css: 'css'};
			var lang = map[ext];

			// Ace doesn't like replacing a textarea directly.
			// We'll stub this out to sit on top of it...
			// line-height is needed to compensate for oddity in WikiEditor extension, which zeroes the line-height on a parent container
			var container = $('<div style="position: relative"><div class="editor" style="line-height: 1.5em; top: 0px; left: 0px; right: 0px; bottom: 0px; border: 1px solid gray"></div></div>').insertAfter(box);
			var editdiv = container.find('.editor');

			box.css('display', 'none');
			container.width(box.width())
					 .height(box.height());

			editdiv.text(box.val());
			context.codeEditor = ace.edit(editdiv[0]);

			// fakeout for bug 29328
			context.$iframe = [
				{
					contentWindow: {
						focus: function() {
							context.codeEditor.focus();
						}
					}
				}
			];
			box.closest('form').submit(function(event) {
				box.val(context.codeEditor.getSession().getValue());
			});
			context.codeEditor.getSession().setMode(new (require("ace/mode/" + lang).Mode));

			// Force the box to resize horizontally to match in future :D
			var resize = function() {
				container.width(box.width());
			};
			$(window).resize(resize);
			// Use jquery.ui.resizable so user can make the box taller too
			container.resizable({
				handles: 's',
				minHeight: box.height(),
				resize: function() {
					context.codeEditor.resize();
				}
			});

			var summary = $('#wpSummary');
			if (summary.val() == '') {
				summary.val('/* using [[mw:CodeEditor|CodeEditor]] */ ');
			}
			// Let modules know we're ready to start working with the content
			context.fn.trigger( 'ready' );
		}
	},

	/*
	 * Compatibility with the $.textSelection jQuery plug-in. When the iframe is in use, these functions provide
	 * equivilant functionality to the otherwise textarea-based functionality.
	 */

	'getElementAtCursor': function() {
	},

	/**
	 * Gets the currently selected text in the content
	 * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
	 */
	'getSelection': function() {
		return context.codeEditor.getCopyText();
	},
	/**
	 * Inserts text at the begining and end of a text selection, optionally inserting text at the caret when
	 * selection is empty.
	 * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
	 */
	'encapsulateSelection': function( options ) {
		// Does not yet handle 'ownline', 'splitlines' option
		var sel = context.codeEditor.getSelection();
		var range = sel.getRange();
		var selText = context.fn.getSelection();
		var selectAfter = false;
		if ( !selText ) {
			selText = options.peri;
			selectAfter = true;
		} else if ( options.replace ) {
			selText = options.peri;
		}
		var text = options.pre;
		text += selText;
		text += options.post;
		context.codeEditor.insert( text );
		if ( selectAfter ) {
			// May esplode if anything has newlines, be warned. :)
			range.setStart( range.start.row, range.start.column + options.pre.length );
			range.setEnd( range.start.row, range.start.column + selText.length );
			sel.setSelectionRange(range);
		}
	},
	/**
	 * Gets the position (in resolution of bytes not nessecarily characters) in a textarea
	 * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
	 */
	'getCaretPosition': function( options ) {
	},
	/**
	 * Sets the selection of the content
	 * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
	 *
	 * @param start Character offset of selection start
	 * @param end Character offset of selection end
	 * @param startContainer Element in iframe to start selection in. If not set, start is a character offset
	 * @param endContainer Element in iframe to end selection in. If not set, end is a character offset
	 */
	'setSelection': function( options ) {
	},
	/**
	 * Scroll a textarea to the current cursor position. You can set the cursor position with setSelection()
	 * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
	 */
	'scrollToCaretPosition': function( options ) {
		//context.fn.scrollToTop( context.fn.getElementAtCursor(), true );
	},
	/**
	 * Scroll an element to the top of the iframe
	 * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
	 *
	 * @param $element jQuery object containing an element in the iframe
	 * @param force If true, scroll the element even if it's already visible
	 */
	'scrollToTop': function( $element, force ) {
	}
} );

/* Setup the editor */
context.fn.setupCodeEditor();

} } )( jQuery );
