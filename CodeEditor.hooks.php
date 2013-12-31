<?php

class CodeEditorHooks {
	static function getPageLanguage( $title ) {
		global $wgCodeEditorEnableCore;

		if ( $wgCodeEditorEnableCore && method_exists( $title, "getContentModel" ) ) {
			if ( $title->getContentModel() === CONTENT_MODEL_JAVASCRIPT ) {
				return 'javascript';
			} else if ( $title->getContentModel() === CONTENT_MODEL_CSS ) {
				return 'css';
			}
		} elseif( $wgCodeEditorEnableCore && ( $title->isCssOrJsPage() || $title->isCssJsSubpage() ) ) {
			// This block is deprecated. Remove after 1.23 release
			if( preg_match( '/\.js$/', $title->getText() ) )
				return 'javascript';
			if( preg_match( '/\.css$/', $title->getText() ) )
				return 'css';
		}
		
		// Give extensions a chance
		$lang = null;
		wfRunHooks( 'CodeEditorGetPageLanguage', array( $title, &$lang ) );
		
		return $lang;
	}
	
	public static function editPageShowEditFormInitial( &$toolbar ) {
		global $wgOut, $wgTitle;
		$lang = self::getPageLanguage( $wgTitle );
		if ( $lang ) {
			$wgOut->addModules( 'ext.codeEditor' );
		}
		return true;
	}

	public static function onMakeGlobalVariablesScript( &$vars, $output ) {
		global $wgTitle;
		
		$lang = self::getPageLanguage( $wgTitle );
		if( $lang ) {
			$vars['wgCodeEditorCurrentLanguage'] = $lang;
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
