<?php
namespace broccoliHtmlEditor\broccoliFieldTable;

class main extends \broccoliHtmlEditor\fieldBase{

	private $broccoli;

	public function __construct($broccoli){
		$this->broccoli = $broccoli;
		parent::__construct($broccoli);
	}

	/**
	 * データをバインドする
	 */
	public function bind( $fieldData, $mode, $mod ){
		if(!$fieldData){
			$fieldData = array();
		}
		$rtn = '';
		if( array_key_exists('output', $fieldData) && $fieldData['output'] ){
			$rtn .= $fieldData['output'];
		}

		if( $mode == 'canvas' ){
			if( !strlen($rtn) ){
				$rtn .= '<tr><td style="text-align:center;">ダブルクリックして編集してください。</td></tr>';
			}
		}
		return $rtn;
	}

	/**
	 * GPI (Server Side)
	 */
	public function gpi($options){
		$_resMgr = $this->broccoli->resourceMgr();

		switch($options['api']){
			case 'openOuternalEditor':
				$appMode = $this->broccoli->getAppMode();
				if( $appMode != 'desktop' ){
					$message = 'appModeが不正です。';
					return array('result' => false, 'message' => $message);
				}
				$path_xlsx = $_resMgr->getResourceOriginalRealpath( $options['data']['resKey'] );

				if( realpath('/') == '/' ){
					exec('open '.escapeshellarg($path_xlsx).'');
				}elseif( preg_match( '/^[A-Z]\:\\\\/', realpath('/') ) ){
					exec('explorer '.escapeshellarg($path_xlsx).'');
				}

				return array('result' => true);
				break;

			case 'getFileInfo':
				$resInfo = $_resMgr.getResource( $options['data']['resKey'] );
				return $resInfo;
				break;

			case 'excel2html':
				$path_xlsx = $_resMgr->getResourceOriginalRealpath( $options['data']['resKey'] );
				$excel2html = new excel2html();
				$options = array(
					'header_row' => $options['data']['header_row'] ,
					'header_col' => $options['data']['header_col'] ,
					'renderer' => $options['data']['renderer'] ,
					'cell_renderer' => $options['data']['cell_renderer'] ,
					'render_cell_width' => true ,
					'strip_table_tag' => true
				);

				$output = $excel2html->excel2html($path_xlsx, $options);

				return $output;
				break;

			default:
				return array('result' => false, 'message' => 'ERROR: Unknown API');
				break;
		}

		return false;
	}

}
