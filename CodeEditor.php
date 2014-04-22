<?php

/**
 * Helper to load syntax-highlighting editor for JavaScript and CSS pages
 * on-wiki.
 *
 * Extends and requires WikiEditor extension.
 *
 * Extension code is GPLv2 following MediaWiki base.
 * Ace editor JS code follows its own license, see in the 'ace' subdir.
 */

$wgExtensionCredits['other'][] = array(
	'path' => __FILE__,
	'name' => 'CodeEditor',
	'url' => 'https://www.mediawiki.org/wiki/Extension:CodeEditor',
	'author' => array( 'Brion Vibber', 'Derk-Jan Hartman', 'authors of Ace (ajax.org)' ),
	'descriptionmsg' => 'codeeditor-desc',
);

$dir = __DIR__;
$wgAutoloadClasses['CodeEditorHooks'] = $dir . '/CodeEditor.hooks.php';
$wgMessagesDirs['CodeEditor'] = __DIR__ . '/i18n';
$wgExtensionMessagesFiles['CodeEditor'] = $dir . '/CodeEditor.i18n.php';

$wgHooks['EditPage::showEditForm:initial'][] = 'CodeEditorHooks::editPageShowEditFormInitial';
$wgHooks['EditPage::showReadOnlyForm:initial'][] = 'CodeEditorHooks::editPageShowEditFormInitial';
$wgHooks['BeforePageDisplay'][] = 'CodeEditorHooks::onBeforePageDisplay';
$wgHooks['MakeGlobalVariablesScript'][] = 'CodeEditorHooks::onMakeGlobalVariablesScript';

$tpl = array(
	'localBasePath' => __DIR__ . '/modules',
	'remoteExtPath' => 'CodeEditor/modules',
	'group' => 'ext.wikiEditor',
);

$wgResourceModules['ext.codeEditor'] = array(
	'scripts' => 'ext.codeEditor.js',
	'dependencies' => array(
		'ext.wikiEditor.toolbar',
		'jquery.codeEditor'
	),
) + $tpl;

$wgResourceModules['jquery.codeEditor'] = array(
	'scripts' => 'jquery.codeEditor.js',
	'styles' => 'jquery.codeEditor.css',
	'dependencies' => array(
		'jquery.wikiEditor',
		'ext.codeEditor.ace',
		'jquery.ui.resizable'
	),
	'messages' => array(
		'codeeditor-toolbar-toggle',
		'codeeditor-save-with-errors'
	)
) + $tpl;

// Minimal bundling of a couple bits of Ace
$wgResourceModules['ext.codeEditor.ace'] = array(
	'group' => 'ext.codeEditor.ace',
	'scripts' => array(
		'ace/ace.js',
		'ace/mode-javascript.js',
		'ace/mode-json.js',
		'ace/mode-css.js',
		'ace/mode-lua.js',
	),
) + $tpl;

// Extra highlighting modes to match some available GeSHi highlighting languages
$wgResourceModules['ext.codeEditor.ace.modes'] = array(
	'group' => 'ext.codeEditor.ace',
	'scripts' => array(
		'ace/mode-c_cpp.js',
		'ace/mode-clojure.js',
		'ace/mode-csharp.js',
		'ace/mode-coffee.js',
		'ace/mode-groovy.js',
		'ace/mode-html.js',
		'ace/mode-java.js',
		'ace/mode-ocaml.js',
		'ace/mode-perl.js',
		'ace/mode-php.js',
		'ace/mode-python.js',
		'ace/mode-ruby.js',
		'ace/mode-scala.js',
	),
	'dependencies' => 'ext.codeEditor.ace',
) + $tpl;

// Helper to add inline [edit] links to <source> sections
$wgResourceModules['ext.codeEditor.geshi'] = array(
	'scripts' => array(
		'ext.codeEditor.geshi.js'
	),
	'messages' => array(
		'editsection',
		'savearticle'
	)
) + $tpl;

// Experimental feature; not ready yet.
$wgCodeEditorGeshiIntegration = false;

// If this is disabled, CodeEditor will only be available for client-side code
// and extensions, it won't be enabled for standard CSS and JS pages.
$wgCodeEditorEnableCore = true;
