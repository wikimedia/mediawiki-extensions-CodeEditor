<?php

class CodeEditorHooks {
	public static function editPageShowEditFormInitial( &$toolbar ) {
		global $wgOut, $wgTitle;
		if ( $wgTitle->isCssOrJsPage() || $wgTitle->isCssJsSubpage() ) {
			$wgOut->addModules( 'ext.codeEditor' );
		}
		return true;
	}
}
