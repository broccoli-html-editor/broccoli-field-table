<?php
require_once(__DIR__.'/../../vendor/autoload.php');
$req = new \tomk79\request();

@ini_set( 'memory_limit' , -1 );
@error_reporting(E_ERROR | E_PARSE);
@ini_set( 'display_errors', 1 );

// var_dump($req->get_cli_options());
// var_dump($req->get_cli_option('--path'));

$path_xlsx = $req->get_cli_option('--path');
$options = array(
	'header_row' => $req->get_cli_option('--header_row') ,
	'header_col' => $req->get_cli_option('--header_col') ,
	'renderer' => $req->get_cli_option('--renderer') ,
	'cell_renderer' => $req->get_cli_option('--cell_renderer') ,
	'render_cell_width' => true ,
	'strip_table_tag' => true
);
// var_dump($path_xlsx);
// var_dump($options);
if( is_null($path_xlsx) ){
	print '<!-- ERROR: parameter path is required. -->';
	exit;
}
if( !is_file($path_xlsx) || !is_readable($path_xlsx) ){
	print '<!-- ERROR: $path_xlsx is NOT a file or NOT readable. -->';
	exit;
}
$bin = file_get_contents($path_xlsx);
if( !strlen($bin) ){
	// print '<!-- ERROR: $path_xlsx contains NO contents. -->';
	print '';
	exit;
}

$excel2html = new \tomk79\excel2html\main($path_xlsx);
$val = $excel2html->get_html($options);
print $val;
exit;
