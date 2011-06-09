/**
 * MediaWiki:Gadget-codeeditor.js
 * (c) 2011 Brion Vibber <brion @ pobox.com>
 * GPLv2 or later
 *
 * Syntax highlighting, auto-indenting code editor widget for on-wiki JS and CSS pages.
 * Uses embedded Ajax.org Cloud9 Editor: http://ace.ajax.org/
 *
 * Browsers tested:
 * - Firefox 4.0 / Linux
 * - Chrome 10.0.648.204 / Linux
 *
 * Browsers tested with issues:
 * - Opera 11.10 / Linux: copy fails, paste sometimes crashes
 * - IE 8.0.6001.18702 / Win XP: some newlines mysteriously removed, corrupting data;
 *   insertion point keeps resetting back to the top of the page after a click (arrow keys ok)
 * - Safari / iPad 4.3 (8F190): renders ok, but can't set focus or scroll vertically. No focus means no typing. :(
 *   There is some work in progress that needs merging upstream...
 *   https://github.com/ajaxorg/ace/issues/37
 *
 * Known issues:
 * - with both classic & enhanced toolbar, toolbar buttons have no effect.
 *   - do we need an interface for regular actions to work on custom editors, or should it replace the toolbar too?
 * - something keeps trying to load a background worker thread from wrong URL, but seems to fail gracefully.
 * - copy/paste not available from context menu (Firefox, Chrome on Linux -- kbd & main menu commands ok)
 * - libs are loaded from toolserver over HTTP; should at least check for HTTPS (toolserver.org's cert is for *.toolserver.org, so fails on https://toolserver.org)
 * - unlike the textarea in many browsers, the widget isn't automatically resizable; jquery.ui.resizable on the container should fix that
 * - accessibility: tab/shift-tab are overridden. is there a consistent alternative for keyboard-reliant users?
 * - accessibility: accesskey on the original textarea needs to be moved over or otherwise handled
 * - 'discard your changes?' check on tab close doesn't trigger
 * - scrollbar initializes too wide; need to trigger resize check after that's filled
 * - cursor/scroll position not maintained over previews/show changes
 *
 * Reported upstream:
 * - ctrl+R, ctrl+L, ctrl+T are taken over by the editor, which is SUPER annoying
 *     https://github.com/ajaxorg/ace/issues/210
 */
(function(mw, $) {
    // This should point to a checkout of Ace source.
    var editorBase = mw.config.get('wgExtensionAssetsPath') + '/CodeEditor/modules/ace/';

    $(function() {
        var box = $('#wpTextbox1');
        if (box.length > 0) {
            var matches = /\.(js|css)$/.exec(wgTitle);
            if (matches && (wgNamespaceNumber == 2 /* User: */ || wgNamespaceNumber == 8 /* MediaWiki: */)) {
                var ext = matches[1];
                var map = {js: 'javascript', css: 'css'};
                var lang = map[ext];
                var modules = {};
                var load = function(path, callback) {
                    var url = editorBase + path;
                    $.getScript(url, callback);
                };
                load('ace-uncompressed.js', function() {
                    load('mode-' + lang + '.js', function() {
                        // Ace doesn't like replacing a textarea directly.
                        // We'll stub this out to sit on top of it...
                        // line-height is needed to compensate for oddity in WikiEditor extension, which zeroes the line-height on a parent container
                        var container = $('<div style="position: relative"><div class="editor" style="line-height: 1.5em; top: 0px; left: 0px; right: 0px; bottom: 0px; border: 1px solid gray"></div></div>').insertAfter(box);
                        var editdiv = container.find('.editor');

                        box.css('display', 'none');
                        container.width(box.width())
                                 .height(box.height());

                        editdiv.text(box.val());
                        var editor = ace.edit(editdiv[0]);
                        box.closest('form').submit(function(event) {
                            box.val(editor.getSession().getValue());
                        });
                        editor.getSession().setMode(new (require("ace/mode/" + lang).Mode));

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
                                editor.resize();
                            }
                        });

                        var summary = $('#wpSummary');
                        if (summary.val() == '') {
                            summary.val('/* using [[mw:CodeEditor|CodeEditor]] */ ');
                        }
                    });
                });
            }
        }
    });

})(mediaWiki, jQuery);
