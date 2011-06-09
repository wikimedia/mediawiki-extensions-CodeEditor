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
	'url' => 'http://www.mediawiki.org/wiki/Extension:CodeEditor',
	'author' => array( 'Brion Vibber', 'authors of Ace (ajax.org)' ),
	'descriptionmsg' => 'codeeditor-desc',
);

$dir = dirname( __FILE__ );
$wgAutoloadClasses['CodeEditorHooks'] = $dir . '/CodeEditor.hooks.php';
$wgExtensionMessagesFiles['CodeEditor'] = $dir . '/CodeEditor.i18n.php';

$wgHooks['EditPage::showEditForm:initial'][] = 'CodeEditorHooks::editPageShowEditFormInitial';

$wgResourceModules['ext.codeEditor'] = array(
	'localBasePath' => dirname( __FILE__ ) . '/modules',
	'remoteExtPath' => 'CodeEditor/modules',
	'group' => 'ext.codeEditor',
	'scripts' => 'ext.codeEditor.js',
	'dependencies' => array( 'ext.wikiEditor' )
);
