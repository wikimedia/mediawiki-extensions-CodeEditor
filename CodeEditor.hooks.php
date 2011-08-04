<?php

class CodeEditorHooks {
	public static function editPageShowEditFormInitial( &$toolbar ) {
		global $wgOut, $wgTitle;
		if ( $wgTitle->isCssOrJsPage() || $wgTitle->isCssJsSubpage() ) {
			$wgOut->addModules( 'ext.codeEditor' );
		}
		return true;
	}
	
	public static function onBeforePageDisplay( $out, $skin ) {
		global $wgCodeEditorGeshiIntegration;
		if ( $wgCodeEditorGeshiIntegration ) {
			$out->addModules( 'ext.codeEditor.geshi' );
		}
		return true;
	}
}
